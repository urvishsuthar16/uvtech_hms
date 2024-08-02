frappe.pages['task-list'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Task List',
		single_column: true
	});

	let current_employee_id = null;
	let current_shift_type = null;
	let userId = null;
	let employee_name = null
	var currentHour = new Date().getHours();


	let employee_field = page.add_field({
		label: 'Employee',
		fieldtype: 'Link',
		fieldname: 'employee',
		options: 'Employee',
		read_only: 1

	});
	let employee_name_field = page.add_field({
		label: 'Employee Name',
		fieldtype: 'Data',
		fieldname: 'employee_name',
		default: employee_name,
		read_only: 1

	});

	let shift_filter_field = page.add_field({
		label: 'Filter by Shift Type',
		fieldtype: 'Link',
		fieldname: 'shift_filter',
		options: "Shift Type",
		read_only: 1
	});

	frappe.db.get_value('Employee', { user_id: frappe.session.user }, ['name', "default_shift", "employee_name"])
		.then(response => {
			userId = response.message.name;
			console.log("User ID:", userId);

			employee_field.set_value(userId);
			current_employee_id = userId;
			employee_name_field.set_value(response.message.employee_name);

			if (response.message.default_shift) {
				shift_filter_field.set_value(response.message.default_shift);
				assignTasks(userId, current_employee_id, response.message.default_shift, page);
			} else {
				var shift_dialog = new frappe.ui.Dialog({
					title: 'Select Shift Type',
					fields: [
						{
							fieldname: 'shift_type',
							fieldtype: 'Link',
							label: 'Shift Type',
							options: 'Shift Type',
							default: currentHour < 12 ? "Morning" : "Evening",
							reqd: 1
						}
					],
					primary_action_label: 'Assign Tasks',
					primary_action: function () {
						current_shift_type = shift_dialog.get_value('shift_type');
						shift_dialog.hide();
						shift_filter_field.set_value(current_shift_type);

						if (userId) {
							assignTasks(userId, current_employee_id, current_shift_type, page);
						} else {
							frappe.msgprint(__('User ID is not available.'));
						}
					}
				});

				shift_dialog.show();
			}
		})
		.catch(err => {
			frappe.msgprint(__('Error retrieving user information.'));
		});

	$(page.body).on('click', '.btn-primary', function (e) {
		var taskId = e.target.id;  // Assuming taskId is passed in the button's ID

		var dialog = new frappe.ui.Dialog({
			title: 'Upload File and Complete Task',
			fields: [
				{
					fieldtype: 'Table',
					fieldname: 'files',
					label: 'Child Table',
					reqd: 1,
					in_list_view: 1,
					data: [{ "image": "" }], // You can set default data here if needed
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

				if (values.files && values.files.length) {
					let fileslist = values.files.map(row => row.image);
					uploadFilesAndCompleteTask(fileslist, taskId, frappe.session.user);
					window.location.reload();

				} else {
					console.log('No images uploaded.');
					uploadFilesAndCompleteTask([], taskId, frappe.session.user);
					window.location.reload();
				}

				dialog.hide();
			}
		});

		dialog.show();
	// 	$('button.text-muted.btn.btn-default.icon-btn').click(
	// 		()=>{$('[data-fieldname="barcode"]').click()}
	//    )
		// $('div.form-group frappe-control input-max-width').click(
		// 	()=>{$('[data-fieldtype="Attach"]').click()}
		// )
		// // Simulate clicks after dialog shows
		// setTimeout(function () {
		// 	var element = $('[data-fieldtype="Attach"]');
		// 	element.click(); // First click
		// 	setTimeout(function () {
		// 		element.click(); // Second click after 100 ms
		// 		console.log("click in" )
		// 	}, 10);
		// 	console.log("click out" )
		// }, 1);
	});

};

function assignTasks(userId, employee_id, shift_type, page) {
	let today = frappe.datetime.get_today();

	frappe.call({
		method: 'uvtech_hms.hms.page.task_list.task_list.assign_and_get_task',
		args: {
			user: frappe.session.user,
			employee_id: employee_id,
			shift_type: shift_type
		},
		callback: async function (response) {

			try {
				console.log(response.message, "Today's Task");
				let tasks = response.message;

				// Sort the tasks based on the name field
				tasks.sort((a, b) => {
					if (a.name < b.name) return -1;
					if (a.name > b.name) return 1;
					return 0;
				});

				console.log("sorted tasks", tasks);

				// Render tasks to the page
				$(frappe.render_template('task_list', { data: tasks })).appendTo(page.body);

				// Handle table display logic
				const section = document.getElementsByClassName('layout-main-section');
				const lastTable = section[0].querySelector('table:last-child');
				const tables = section[0].getElementsByTagName('table');
				for (let j = 0; j < tables.length; j++) {
					tables[j].style.display = 'none';
				}
				lastTable.style.display = 'table';
			} catch (error) {
				console.log(error);
			}
		},
		error: function (err) {
			frappe.msgprint(__('Error retrieving tasks.'));
		}
	});
}


function uploadFilesAndCompleteTask(files, taskId, user) {
	frappe.call({
		method: 'uvtech_hms.hms.page.task_list.task_list.upload_files_and_change_task_status',
		args: {
			files: files,
			taskId: taskId,
			user: user
		},
		callback: function (response) {
			frappe.msgprint("Task has successfully completed")
			// window.location.reload();
		},
		error: function (err) {
			frappe.msgprint(__('Error completing task.'));
		}
	});
}
