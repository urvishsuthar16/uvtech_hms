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
	let allimages = []


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
		label: 'Shift',
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
		var taskId = e.target.id;
		var fileslist = [];
		var dialog = new frappe.ui.Dialog({
			title: 'Upload File and Complete Task',
			fields: [
				{
					fieldname: 'image_box',
					fieldtype: 'HTML',
					options:
						`<input type="file" id="file-input" multiple style="display: none;" />
							<label for="file-input" style="
								display: inline-block;
								padding: 6px 12px;
								cursor: pointer;
								background-color: #007bff;
								color: white;
								border-radius: 4px;
								font-size: 14px;
							">
								Add
							</label>
						<div id="preview-container" style="margin-top: 10px;">
							<!-- Image previews will be inserted here -->
						</div>`

				},
				// {
				// 	fieldtype: 'Table',
				// 	fieldname: 'files',
				// 	label: 'Child Table',
				// 	// reqd: 1,
				// 	in_list_view: 1,
				// 	data: [], // You can set default data here if needed
				// 	fields: [
				// 		{
				// 			fieldname: 'image',
				// 			fieldtype: 'Attach',
				// 			label: 'Image',
				// 			in_list_view: 1
				// 		}
				// 	]
				// }
			],
			primary_action_label: 'Complete',
			primary_action: function () {
				// var values = dialog.get_values();

				// if (values.files && values.files.length) {
				// 	let fileslist = values.files.map(row => row.image);
				// 	uploadFilesAndCompleteTask(fileslist, taskId);
				// 	// window.location.reload();

				// } else {
				// 	console.log('No images uploaded.');
				// 	uploadFilesAndCompleteTask([], taskId);
				// 	// window.location.reload();
				// }

				var fileInputs = document.getElementById('file-input').files;
				console.log(allimages)
				if (allimages.length > 0) {
					Array.from(allimages).forEach(file => {
						console.log(file)
						uploadSingleFile(file, taskId, frappe.session.user, fileslist, function (updatedFilesList) {
							// Callback after each file is uploaded, with the updated fileslist
							console.log('Current fileslist:', updatedFilesList);

							// Check if all files have been uploaded
							if (updatedFilesList.length === allimages.length) {
								uploadFilesAndCompleteTask(updatedFilesList, taskId, frappe.session.user);
								// window.location.reload();
							}
						});
					});
				} else {
					console.log('No images uploaded.');
					uploadFilesAndCompleteTask([], taskId, frappe.session.user);
					// window.location.reload();
				}

				dialog.hide();
			}
		});

		// Show the dialog
		dialog.show();

		// Function to upload a single file
		function uploadSingleFile(file, taskId, user, fileslist, callback) {
			let formData = new FormData();
			formData.append('file', file, file.name);

			// Example additional form data
			formData.append('task_id', taskId);
			formData.append('user', user);

			var xhr = new XMLHttpRequest();
			xhr.open('POST', '/api/method/upload_file', true);
			xhr.setRequestHeader('Accept', 'application/json');
			xhr.setRequestHeader('X-Frappe-CSRF-Token', frappe.csrf_token);

			xhr.onload = function () {
				if (xhr.status === 200) {
					const response = JSON.parse(xhr.responseText);
					if (response.message && response.message.file_url) {
						const filePath = response.message.file_url;
						console.log('File uploaded successfully:', filePath);

						// Append the file path to fileslist
						fileslist.push(filePath);

						// Execute the callback function with the updated fileslist
						callback(fileslist);
					} else {
						console.error('File upload successful, but no file path returned.');
					}
				} else {
					console.error('Error uploading file:', xhr.statusText);
				}
			};

			xhr.onerror = function () {
				console.error('Request failed');
			};

			xhr.send(formData);
		}

		// Add the change event listener after the dialog is shown
		$(document).off('change', '#file-input').on('change', '#file-input', function (e) {
			var files = e.target.files;
			allimages.push(...files);
			var previewContainer = $('#preview-container');

			// Clear the preview container before appending new images
			previewContainer.empty();

			// Loop through all the images in allimages array and display them
			allimages.forEach(file => {
				var reader = new FileReader();
				reader.onload = function (e) {
					var img = $('<img>').attr('src', e.target.result)
						.css({
							width: '100px',
							height: '100px',
							margin: '5px',
							border: '1px solid #ccc'
						});
					previewContainer.append(img);
				}
				reader.readAsDataURL(file);
			});
		});
	});

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
}