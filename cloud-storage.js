
// Cloud Storage Module for SAWYAN Calculator
// Handles Supabase connection and data persistence

const SUPABASE_URL = 'https://dssspiossqgroefmvnql.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzc3NwaW9zc3Fncm9lZm12bnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMzUxMDAsImV4cCI6MjA4MDcxMTEwMH0.6c6q77dBnQE49_sC1FxH-0ajP0Q8_RBlxw64fAR4ATQ';

// Initialize Supabase client
let supabaseClient = null;

const CloudStorage = {
    init: function () {
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Connected to Supabase Cloud');
            this.showCloudIndicator();
        } else {
            console.warn('⚠️ Supabase library not failed to load');
        }
    },

    // Save entire state object to cloud
    save: async function (data) {
        if (!supabaseClient) return false;

        // We use a fixed ID for this demo/single-user version
        // In a real app, this would be dynamic auth ID
        const STORAGE_KEY = 'global_calculator_state';

        try {
            const { error } = await supabaseClient
                .from('calculator_data')
                .upsert({
                    id: STORAGE_KEY,
                    data: data,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            this.updateIndicator('saved');
            return true;
        } catch (err) {
            console.error('❌ Cloud Save Error:', err);
            this.updateIndicator('error');
            return false;
        }
    },

    // Load state from cloud
    load: async function () {
        if (!supabaseClient) return null;
        const STORAGE_KEY = 'global_calculator_state';

        try {
            const { data, error } = await supabaseClient
                .from('calculator_data')
                .select('data')
                .eq('id', STORAGE_KEY)
                .single();

            if (error) throw error;
            if (data && data.data) {
                return data.data;
            }
            return null;
        } catch (err) {
            console.warn('⚠️ Cloud Load Error (might be empty):', err.message);
            return null;
        }
    },

    // UI Indicator
    showCloudIndicator: function () {
        let indicator = document.getElementById('cloudSaveIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'cloudSaveIndicator';
            indicator.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: rgba(16, 185, 129, 0.1);
                color: #10B981;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
                backdrop-filter: blur(4px);
                border: 1px solid rgba(16, 185, 129, 0.2);
                z-index: 9999;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(indicator);
        }
        this.updateIndicator('ready');
    },

    updateIndicator: function (status) {
        const el = document.getElementById('cloudSaveIndicator');
        if (!el) return;

        if (status === 'saving') {
            el.innerHTML = '<i class="fa-solid fa-cloud-arrow-up fa-fade"></i> جاري الحفظ...';
            el.style.color = '#3B82F6';
            el.style.borderColor = 'rgba(59, 130, 246, 0.3)';
            el.style.background = 'rgba(59, 130, 246, 0.1)';
        } else if (status === 'saved') {
            el.innerHTML = '<i class="fa-solid fa-cloud-check"></i> تم الحفظ في سحابة المشروع';
            el.style.color = '#10B981';
            el.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            el.style.background = 'rgba(16, 185, 129, 0.1)';

            // Revert to 'ready' after 3 seconds
            setTimeout(() => {
                el.innerHTML = '<i class="fa-solid fa-cloud"></i> متصل بالسحابة';
            }, 3000);
        } else if (status === 'error') {
            el.innerHTML = '<i class="fa-solid fa-cloud-exclamation"></i> فشل الحفظ';
            el.style.color = '#EF4444';
        } else {
            el.innerHTML = '<i class="fa-solid fa-cloud"></i> متصل بالسحابة';
        }
    }
};

// Initialize when execution starts
document.addEventListener('DOMContentLoaded', () => {
    CloudStorage.init();
});

// Expose globally
window.CloudStorage = CloudStorage;
