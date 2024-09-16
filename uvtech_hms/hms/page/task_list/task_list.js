frappe.pages['task-list'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Task List ',
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

	let regenerate_button = page.add_field({
		label: 'Generate',
		fieldtype: 'Button',
		fieldname: 'generate_button'
	});

	// Add click event listener for the button
	regenerate_button.$input.on('click', function () {
		generate_the_list();
	});

	function generate_the_list() {
		var shift_dialog = new frappe.ui.Dialog({
			title: 'Select Shift Type',
			fields: [
				{
					fieldname: 'shift_type',
					fieldtype: 'Link',
					label: 'Shift Type',
					options: 'Shift Type',
					default: "",
					reqd: 1
				}
			],
			primary_action_label: 'Assign Tasks',
			primary_action: function () {
				let current_filter_value = shift_filter_field.get_value();

				let current_shift_type = shift_dialog.get_value('shift_type');
		
				shift_dialog.hide();
				if (current_shift_type === current_filter_value) {
					// Show message indicating the user is already on the same shift
					frappe.msgprint(__('You are already on the Same Shift Type: {0}.', [current_shift_type]));
					return 
				}
				// Show confirmation popup
				frappe.confirm(
					__('Are you sure you want to assign tasks for Shift Type: {0}?', [current_shift_type]),
					function() {
						
						shift_filter_field.set_value(current_shift_type);
		
						if (userId) {
							frappe.db.set_value("Employee", current_employee_id, "default_shift", current_shift_type);
							frappe.call({
								method: 'uvtech_hms.hms.page.task_list.task_list.delete_existing_tasks',
								args: {
									employee_id: userId,
									shift_type: current_shift_type
								},
								callback: function (response) {
									shift_filter_field.set_value(current_shift_type);
									assignTasksTable(userId, current_shift_type, page);
								}
							});
						} else {
							frappe.msgprint(__('User ID is not available.'));
						}
					},
					function() {
						// If "No" is clicked, do nothing
						frappe.msgprint(__('Task assignment cancelled.'));
					}
				);
			}
		});
		
		shift_dialog.show();
		
	}


	frappe.db.get_value('Employee', { user_id: frappe.session.user }, ['name', "default_shift", "employee_name"])
		.then(response => {
			
			userId = response.message.name;

			employee_field.set_value(userId);
			current_employee_id = userId;
			employee_name_field.set_value(response.message.employee_name);

			if (response.message.default_shift) {
				shift_filter_field.set_value(response.message.default_shift);
			}
			assignTasksTable( userId, response.message.default_shift, page)
			// assignTasks(userId, userId, response.message.default_shift, page)

		})
		.catch(err => {
			frappe.msgprint(__('Error retrieving user information.'));
		});


	$(page.body).on('click', '.completed-button', function (e) {
		var taskId = e.target.id;
		console.log(taskId)
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
				
			],
			primary_action_label: 'Complete',
			primary_action: function () {

				var fileInputs = document.getElementById('file-input').files;
				console.log(allimages)
				if (allimages.length > 0) {
					Array.from(allimages).forEach(file => {
						console.log(file)
						uploadSingleFile(file, taskId, frappe.session.user, fileslist, function (updatedFilesList) {

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
			allimages.forEach((file, index) => {
				var reader = new FileReader();
				reader.onload = function (e) {
					// Create an image element
					var img = $('<img>').attr('src', e.target.result)
						.css({
							width: '100px',
							height: '100px',
							margin: '5px',
							border: '1px solid #ccc'
						});

					// Create a delete button
					var deleteButton = $('<button>')
						.text('Delete')
						.css({
							display: 'block',
							margin: '5px auto',
							cursor: 'pointer',
							backgroundColor: '#ff4d4d',
							color: 'white',
							border: 'none',
							padding: '5px',
							borderRadius: '4px'
						})
						.on('click', function () {
							// Remove the image from the preview
							img.remove();
							deleteButton.remove();
							allimages.splice(index, 1);
						});

					// Append image and delete button to the preview container
					previewContainer.append(img).append(deleteButton);
				}
				reader.readAsDataURL(file);
			});
		});
	});


	
	function assignTasksTable( userId, shift, page) {
		frappe.call({
			method: 'uvtech_hms.hms.page.task_list.task_list.get_all_task_list',
			args: {
				user: frappe.session.user,
				employee_id: userId,
				shift_type: shift
			},
			callback: function (response) {
				let all_task_list = response.message

				all_task_list.sort((a, b) => {
					if (a.custom_priority_no < b.custom_priority_no) return -1;
					if (a.custom_priority_no > b.custom_priority_no) return 1;
					return 0;
				});

				// Render tasks to the page
				$(frappe.render_template('task_list', { data: all_task_list })).appendTo(page.body);

				// Handle table display logic
				const section = document.getElementsByClassName('layout-main-section');
				const lastTable = section[0].querySelector('table:last-child');
				const tables = section[0].getElementsByTagName('table');
				for (let j = 0; j < tables.length; j++) {
					tables[j].style.display = 'none';
				}
				lastTable.style.display = 'table';
			}
		})

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
				// frappe.msgprint("Task has successfully completed")
				window.location.reload();
			},
			error: function (err) {
				frappe.msgprint(__('Error completing task.'));
			}
		});
	}
}