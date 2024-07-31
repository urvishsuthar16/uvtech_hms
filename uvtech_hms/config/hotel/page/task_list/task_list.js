frappe.pages['task-list'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Task List',
        single_column: true
    });

    // Initialize in-memory variables to store state
    let current_employee_id = null;
    let current_shift_type = null;
    let userId = null;

    // Add employee field
    let employee_field = page.add_field({
        label: 'Employee',
        fieldtype: 'Link',
        fieldname: 'employee',
        options: 'Employee',
        change() {
            current_employee_id = employee_field.get_value();
            console.log("employee_id", current_employee_id);

            current_shift_type = shift_filter_field.get_value();

            if (current_employee_id) {
                if (current_shift_type) {
                    // Directly assign tasks if shift type is already selected
                    if (userId) {
                        assignTasks(userId, current_employee_id, current_shift_type, page);
                    } else {
                        frappe.msgprint(__('User ID is not available.'));
                    }
                } else {
                    // Open a dialog to select shift type
                    var shift_dialog = new frappe.ui.Dialog({
                        title: 'Select Shift Type',
                        fields: [
                            {
                                fieldname: 'shift_type',
                                fieldtype: 'Link',
                                label: 'Shift Type',
                                options: 'Shift Type',
                                reqd: 1
                            }
                        ],
                        primary_action_label: 'Assign Tasks',
                        primary_action: function () {
                            current_shift_type = shift_dialog.get_value('shift_type');
                            shift_dialog.hide();

                            // Update shift filter field and fetch tasks
                            shift_filter_field.set_value(current_shift_type);
                            localStorage.setItem('current_shift_type', current_shift_type);
                            if (userId) {
                                assignTasks(userId, current_employee_id, current_shift_type, page);
                            } else {
                                frappe.msgprint(__('User ID is not available.'));
                            }
                        }
                    });

                    shift_dialog.show();
                }
            }
        }
    });

    // Add shift type filter field
    let shift_filter_field = page.add_field({
        label: 'Filter by Shift Type',
        fieldtype: 'Select',
        fieldname: 'shift_filter',
        options: [
            { value: '', label: ' ' }, // Default option
            { value: 'Morning', label: 'Morning' },
            { value: 'Evening', label: 'Evening' }
            // Add other shift types as needed
        ],
        change() {
            current_shift_type = shift_filter_field.get_value();
            localStorage.setItem('current_shift_type', current_shift_type);
            let employee_id = employee_field.get_value();

            if (employee_id && current_shift_type) {
                if (userId) {
                    assignTasks(userId, employee_id, current_shift_type, page);
                } else {
                    frappe.msgprint(__('User ID is not available.'));
                }
            }
        }
    });

    // Fetch userId from server
    frappe.db.get_value('Employee', { user_id: frappe.session.user }, 'name')
        .then(response => {
            userId = response.message.name;
            console.log("User ID:", userId);

            // Set the employee field to the retrieved userId
            employee_field.set_value(userId);
            current_employee_id = userId;

            // Retrieve shift type from local storage
            current_shift_type = localStorage.getItem('current_shift_type');
            if (current_shift_type) {
                shift_filter_field.set_value(current_shift_type);
                assignTasks(userId, current_employee_id, current_shift_type, page);
            }
        })
        .catch(err => {
            frappe.msgprint(__('Error retrieving user information.'));
        });

    // ON COMPLETE BUTTON
    $(page.body).on('click', '.btn-primary', function (e) {
        var taskId = e.target.id;  // Assuming taskId is passed in the button's ID

        // Open dialog for file upload
        var dialog = new frappe.ui.Dialog({
            title: 'Upload File and Complete Task',
            fields: [
                {
                    fieldtype: 'Table',
                    fieldname: 'files',
                    label: 'Child Table',
                    reqd: 1,
                    in_list_view: 1,
                    data: [], // You can set default data here if needed
                    fields: [
                        {
                            fieldname: 'image',
                            fieldtype: 'Attach',
                            label: 'Image',
                            in_list_view: 1
                        }
                    ]
                }
            ],
            primary_action_label: 'Complete',
            primary_action: function () {
                var values = dialog.get_values();

                // Log the child table images
                if (values.files && values.files.length) {
                    let fileslist = values.files.map(row => row.image);
                    uploadFilesAndCompleteTask(fileslist, taskId);

                    console.log('Child Table Images:', fileslist);
                } else {
                    console.log('No images uploaded.');
                }

                // Perform file upload and task update
                dialog.hide();
            }
        });

        dialog.show();
    });
};

function assignTasks(userId, employee_id, shift_type, page) {
    let today = frappe.datetime.get_today();

    frappe.call({
        method: 'uvtech_hrms.hotel.page.task_list.task_list.assign_and_get_task',
        args: {
            user: frappe.session.user,
            employee_id: employee_id,
            shift_type: shift_type
        },
        callback: function(response) {
            console.log(response.message, "Today's Task");
            let tasks = response.message; // Adjust according to your server-side response

            // Clear existing content if needed
            // $(page.body).empty();

            if (tasks && tasks.length > 0) {
                $(frappe.render_template('task_list', { data: tasks })).appendTo(page.body);
            } else {
                // No tasks found for today
                $(frappe.render_template('task_list', { data: [] })).appendTo(page.body);
            }
        },
        error: function(err) {
            frappe.msgprint(__('Error retrieving tasks.'));
        }
    });
}

function uploadFilesAndCompleteTask(files, taskId) {
    frappe.call({
        method: 'uvtech_hrms.hotel.page.task_list.task_list.upload_files_and_change_task_status',
        args: {
            files: files,
            taskId: taskId
        },
        callback: function(response) {
            console.log(response.message, "Task Completed");
            window.location.reload();
        },
        error: function(err) {
            frappe.msgprint(__('Error completing task.'));
        }
    });
}
