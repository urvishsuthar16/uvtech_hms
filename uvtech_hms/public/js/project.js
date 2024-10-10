frappe.ui.form.on('Project', {
    refresh(frm) {
        if (frm.is_new()) {
            // Fetch all active users with the 'Staff' role
            frappe.call({
                method: 'uvtech_hms.update.get_staff_users',  // Adjust path to your method

                callback: function (response) {
                    if (response.message) {
                        let staff_users = response.message;

                        staff_users.forEach(user => {
                            let child = frm.add_child('users');
                            child.user = user.email;
                            child.full_name = user.full_name;
                        });

                        frm.refresh_field('users');
                    }
                }
            });
            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Task',
                    filters: {
                        is_template: 1
                    },
                    fields: ['name', 'subject', 'type', 'priority', 'custom_shift', 'custom_is_attachments_need'],
                    limit_page_length: 100  // Set the limit to a large number
                },
                callback: function (response) {
                    if (response.message) {
                        let template_tasks = response.message;
                        // Clear the existing rows in the Custom Assign Task child table
                        frm.clear_table('custom_assign_task');

                        template_tasks.forEach(task => {
                            let child = frm.add_child('custom_assign_task');
                            child.task_id = task.name;
                            child.subject = task.subject;
                            child.type = task.type;
                            child.priority = task.priority;
                            child.shift = task.custom_shift;
                            child.is_attachments_need = task.custom_is_attachments_need;
                        });

                        // Refresh the field to display the added tasks
                        frm.refresh_field('custom_assign_task');
                    }
                }
            });

        }
    },

    before_save: function (frm) {
        let users = frm.doc.users || [];
        let tasks = frm.doc.custom_assign_task || [];
    
        let hasAssignedUser = users.some(user => user.custom_assiged === 1);
        
        let hasAssignedTask = tasks.some(task => task.assign === 1);
    
        if (!hasAssignedUser) {
            frappe.msgprint(__('Please assign at least one user to the Location.'));
            frappe.validated = false; // Prevent form submission
            return;
        }
    
        if (!hasAssignedTask) {
            frappe.msgprint(__('Please assign at least one task to the Location.'));
            frappe.validated = false; // Prevent form submission
            return;
        }
    }
    
});


frappe.ui.form.on('Project User', {
    custom_assiged: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        if (row.custom_assiged) {
            frappe.call({
                args: {
                    user: row.user,
                    project_name: frm.doc.name  // Use the current project's name
                },
                method: 'uvtech_hms.update.check_is_user_assigned',  // Path to your Python method
                callback: function (response) {
                    if (response.message.status === 'assigned') {
                        frappe.msgprint({
                            title: __('User Already Assigned'),
                            indicator: 'red',
                            message: __('User {0} is already assigned to projects: {1}',
                                [row.user, response.message.projects.join(', ')]
                            )
                        });

                        frappe.model.set_value(cdt, cdn, 'custom_assiged', 0);
                    }
                }
            });
        }
    }
});



