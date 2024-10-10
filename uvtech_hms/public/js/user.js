frappe.ui.form.on('User', {
    refresh(frm) {
        if (frm.is_new()) {
            
            if (frappe.user_roles.includes('SPL Manager') && frappe.user_roles.length < 10) {
                frm.set_query("role_profile_name", function () {
                    return {
                        filters: {
                            name: ['in', ['SPL Manager', 'SPL Staff']]
                        },
                    };
                });
            frm.set_value('role_profile_name', 'SPL Staff')
            } 
        }
    }
});
