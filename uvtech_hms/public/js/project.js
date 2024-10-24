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
            clear_the_task_table(frm)

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

        const priorityOrder = {
            "Urgent": 1,
            "High": 2,
            "Medium": 3,
            "Low": 4
        };

        tasks.sort((a, b) => {
            // Sort by 'assign' field (assign should be at the top)
            if (a.assign !== b.assign) {
                return a.assign > b.assign ? -1 : 1;  // Change comparison to bring assigned tasks at the top
            }

            // Sort by shift (morning shift should come first)
            if (a.shift !== b.shift) {
                return (a.shift === "Morning") ? -1 : 1;  // Morning shift first
            }
            if (a.type !== b.type) {
                return (a.type === "Weekly") ? -1 : 1;  //  shift first
            }

            // Sort by priority based on the defined order (Urgent > High > Medium > Low)
            return (priorityOrder[a.priority] || 5) - (priorityOrder[b.priority] || 5);
        });

        // Clear the table and re-add the sorted tasks
        frm.clear_table('custom_assign_task');
        tasks.forEach(task => {
            let child = frm.add_child('custom_assign_task');
            child.task_id = task.task_id;
            child.subject = task.subject;
            child.type = task.type;
            child.priority = task.priority;
            child.shift = task.shift;
            child.is_attachments_need = task.is_attachments_need;
            child.assign = task.assign;
        });

        // Refresh the custom_assign_task field to display the sorted tasks
        frm.refresh_field('custom_assign_task');


    },
    custom_reset: function (frm) {
        frappe.confirm("Are you sure you want to Reload Task List?",
            function () {
                clear_the_task_table(frm)
            }
        );
       
        
    },
    custom_update: function (frm) {
        update_the_task_list(frm)
    }, 
    custom_assign_all_tasks: function (frm) {
        update_assign_all_tasks(frm)
    }
});


// frappe.ui.form.on('Project User', {
//     custom_assiged: function (frm, cdt, cdn) {
//         let row = locals[cdt][cdn];

//         if (row.custom_assiged) {
//             frappe.call({
//                 args: {
//                     user: row.user,
//                     project_name: frm.doc.name  // Use the current project's name
//                 },
//                 method: 'uvtech_hms.update.check_is_user_assigned',  // Path to your Python method
//                 callback: function (response) {
//                     if (response.message.status === 'assigned') {
//                         frappe.msgprint({
//                             title: __('User Already Assigned'),
//                             indicator: 'red',
//                             message: __('User {0} is already assigned to projects: {1}',
//                                 [row.user, response.message.projects.join(', ')]
//                             )
//                         });

//                         frappe.model.set_value(cdt, cdn, 'custom_assiged', 0);
//                     }
//                 }
//             });
//         }
//     }
// });





function clear_the_task_table(frm) {
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



function update_the_task_list(frm) {
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Task',
            filters: {
                is_template: 1
            },
            fields: ['name', 'subject', 'type', 'priority', 'custom_shift', 'custom_is_attachments_need'],  // Include 'assign' field
            limit_page_length: 500  // Set the limit to a large number
        },
        callback: function (response) {
            if (response.message) {
                let template_tasks = response.message;

                let existing_tasks = frm.doc.custom_assign_task.map(task => task.task_id);

                template_tasks.forEach(task => {
                    // Check if the task already exists based on subject
                    if (!existing_tasks.includes(task.name)) {
                        // If task does not exist, add it
                        let child = frm.add_child('custom_assign_task');
                        child.task_id = task.name;
                        child.subject = task.subject;
                        child.type = task.type;
                        child.priority = task.priority;
                        child.shift = task.custom_shift;
                        child.is_attachments_need = task.custom_is_attachments_need;
                        child.assign = task.assign;  // Set assign field
                    }
                });

                frm.refresh_field('custom_assign_task');
                frappe.msgprint('Successfully New Tasks are Updated')
            }
        }
    });
}


function update_assign_all_tasks(frm){
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
                    child.assign = 1;
                });

                // Refresh the field to display the added tasks
                frm.refresh_field('custom_assign_task');
            }
        }
    });
}