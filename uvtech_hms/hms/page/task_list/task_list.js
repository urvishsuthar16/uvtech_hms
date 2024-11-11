frappe.pages['task-list'].on_page_load = function (wrapper) {
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

	let location_filed = page.add_field({
		label: 'Location',
		fieldtype: 'Select',
		fieldname: 'location',
		reqd: 1
	});
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
		reqd: 1
		// read_only: 1
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

	async function generate_the_list() {

		let current_shift_type = shift_filter_field.get_value();
		let res = await frappe.db.get_value('Project', {'project_name': location_filed.get_value() }, ['name']);
		let current_location_filed = res.message.name
		if (!current_shift_type) {
			frappe.msgprint(__('Please select a valid Shift Type before assigning tasks.'));
			return; // Exit the function if no shift type is selected
		}
		if (!current_location_filed) {
			frappe.msgprint(__('Please Select A Location'));
			return; // Exit the function if no shift type is selected
		}
		// Show confirmation popup
		frappe.confirm(
			__('Are you sure you want to assign tasks for Shift Type: {0}?', [current_shift_type]),
			function () {
				frappe.dom.freeze('Loading...');
				shift_filter_field.set_value(current_shift_type);

				if (userId) {
					// frappe.db.set_value("Employee", current_employee_id, "default_shift", current_shift_type);
					frappe.call({
						method: 'uvtech_hms.hms.page.task_list.task_list.delete_existing_tasks',
						args: {
							employee_id: userId,
							shift_type: current_shift_type,
							project: current_location_filed
						},
						callback: function (response) {
							shift_filter_field.set_value(current_shift_type);
							assignTasksTable(userId, current_shift_type, page, current_location_filed);
							update_shift_data_templage(current_shift_type, current_location_filed)
						}
					});
				} else {
					frappe.msgprint(__('User ID is not available.'));
				}
			},
			function () {
				// If "No" is clicked, do nothing
				frappe.msgprint(__('Task assignment cancelled.'));
			}
		);

	}


	frappe.db.get_value('Employee', { user_id: frappe.session.user }, ['name', 'default_shift', 'employee_name'])
		.then(response => {
			if (!response.message.name){
				 return ''
			}
			userId = response.message.name;
			let defaultShift = response.message.default_shift;

			// Set values for employee fields
			employee_field.set_value(userId);
			current_employee_id = userId;
			employee_name_field.set_value(response.message.employee_name);

			// Check for the shift in 'Staff Temporary Data' first
			frappe.db.get_value('Staff temporary data', { employee_id: userId }, ['shift', 'location'])
				.then(tempDataResponse => {
					let shift = tempDataResponse.message ? tempDataResponse.message.shift : null;
					let location_val = tempDataResponse.message ? tempDataResponse.message.location : null;

					frappe.db.get_value('Project', location_val, ['project_name'])
						.then(res => {
							location_filed.set_value(res.message.project_name)
						})
					frappe.call({
							method: 'uvtech_hms.hms.page.task_list.task_list.get_user_assigned_project',
			
							callback: function (response) {
			
								if (response.message) {
									let project_list = response.message
									console.log(project_list, 'ra,   aaa')
									location_filed.set_value(project_list[0])
									location_filed.refresh();
								}
							},
			
						});
					
					// If shift is found in 'Staff Temporary Data', use it, otherwise use default shift from 'Employee'
					if (shift) {
						shift_filter_field.set_value(shift);
					} else if (defaultShift) {
						shift_filter_field.set_value(defaultShift);
					}
					// Call the function to assign tasks using the correct shift
					if (tempDataResponse.message.location){
						console.log(tempDataResponse.message.location, 'reso')
						assignTasksTable(userId, shift || defaultShift, page, location_val);
					}
				});
				frappe.call({
					method: 'uvtech_hms.hms.page.task_list.task_list.get_user_assigned_project',
	
					callback: function (response) {
	
						if (response.message) {
							let project_list = response.message
							location_filed.df.options = project_list.join("\n"); // Join the list into new line separated values
							location_filed.refresh();
						}
					},
	
				});
		});





	$(page.body).on('click', '.task-complete-button', async function (e) {
		var taskId = e.target.id;
		let custom_is_attachments_need = (await frappe.db.get_value("Task", taskId, "custom_is_attachments_need")).message.custom_is_attachments_need;
		var allimages = [];

		if (custom_is_attachments_need) {

			var fileslist = [];
			var uniqueId = new Date().getTime(); // Generate a unique ID based on timestamp
			var dialog = new frappe.ui.Dialog({
				title: 'Upload File and Complete Task',
				fields: [
					{
						fieldname: 'camera_button',
						fieldtype: 'Button',
						label: 'Use Camera',
						click: function () {
							// Change input field for camera
							document.getElementById(`file-input-${uniqueId}`).setAttribute("accept", "image/*");
							document.getElementById(`file-input-${uniqueId}`).setAttribute("capture", "environment");
							document.getElementById(`file-input-${uniqueId}`).click();
						}
					},

					{
						fieldname: 'gallery_button',
						fieldtype: 'Button',
						label: 'Choose from Gallery',
						click: function () {
							// Change input field for gallery
							document.getElementById(`file-input-${uniqueId}`).setAttribute("accept", "image/*");
							document.getElementById(`file-input-${uniqueId}`).removeAttribute("capture");
							document.getElementById(`file-input-${uniqueId}`).click();
						}
					},

					{
						fieldname: 'image_box',
						fieldtype: 'HTML',
						options:
							`<input type="file" accept="image/*" id="file-input-${uniqueId}" multiple style="display: none;" />
							<div id="preview-container-${uniqueId}" style="margin-top: 10px;">
								<!-- Image previews will be inserted here -->
							</div>`
					}
				],

				primary_action_label: 'Complete',
				primary_action: function () {
					frappe.dom.freeze('Uploading...');
					var fileInputs = document.getElementById(`file-input-${uniqueId}`).files;
					if (allimages.length > 0) {
						Array.from(allimages).forEach(file => {
							handleFileUpload(file, taskId, frappe.session.user, fileslist, function (updatedFilesList) {
								// Check if all files have been uploaded
								if (updatedFilesList.length === allimages.length) {
									uploadFilesAndCompleteTask(updatedFilesList, taskId, frappe.session.user);
								}
							});
						});
					} else {
						frappe.msgprint(__('Please add at least one image.'));
						frappe.dom.unfreeze();
						return
					}

					dialog.hide();
				}
			});

			dialog.show();
			var previewContainer = $(`#preview-container-${uniqueId}`);
			previewContainer.empty();
			allimages = [];

			function handleFileUpload(file, taskId, user, fileslist, callback) {
				if (file.type === 'image/heic' || file.type === 'image/heif') {
					// Convert HEIC/HEIF images to JPEG
					heic2any({
						blob: file,
						toType: "image/jpeg"
					}).then((convertedBlob) => {
						resizeAndUploadImage(new File([convertedBlob], file.name + ".jpg"), taskId, user, fileslist, callback);
					}).catch(error => {
						if (error.code === 1 && error.message.includes('browser readable')) {
							resizeAndUploadImage(file, taskId, user, fileslist, callback);
						} else {
							console.error('Error converting HEIC to JPEG:', error);
						}
					});
				} else if (file.type.startsWith('image/')) {
					// Handle regular image files
					resizeAndUploadImage(file, taskId, user, fileslist, callback);
				} else if (file.type.startsWith('video/')) {
					// Handle video files
					compressAndUploadVideo(file, taskId, user, fileslist, callback);
				} else {
					uploadSingleFile(file, taskId, user, fileslist, callback);
				}
			}

			// Function to resize and upload images
			function resizeAndUploadImage(file, taskId, user, fileslist, callback, maxWidth = 1024, maxHeight = 1024, quality = 0.8) {
				const reader = new FileReader();

				reader.onload = function (event) {
					const img = new Image();
					img.src = event.target.result;

					img.onload = function () {
						const canvas = document.createElement('canvas');
						let width = img.width;
						let height = img.height;

						// Calculate the new dimensions while maintaining the aspect ratio
						if (width > maxWidth || height > maxHeight) {
							if (width > height) {
								height = Math.floor(height * (maxWidth / width));
								width = maxWidth;
							} else {
								width = Math.floor(width * (maxHeight / height));
								height = maxHeight;
							}
						}

						// Resize the image on the canvas
						canvas.width = width;
						canvas.height = height;
						const ctx = canvas.getContext('2d');
						ctx.drawImage(img, 0, 0, width, height);

						// Convert the canvas image to a Blob (JPEG for better compression)
						canvas.toBlob(function (blob) {
							// Proceed with file upload (blob is the resized image)
							uploadSingleFile(new File([blob], file.name), taskId, user, fileslist, callback);
						}, 'image/jpeg', quality); // Compress to JPEG with the specified quality
					};
				};

				reader.readAsDataURL(file); // Read file as data URL to resize
			}

			function compressAndUploadVideo(file, taskId, user, fileslist, callback) {

			}
			// Function to upload a single file
			function uploadSingleFile(file, taskId, user, fileslist, callback) {
				let formData = new FormData();
				formData.append('file', file, file.name);
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
							fileslist.push(filePath);
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


			// Handle the file input change and show preview
			$(document).off('change', `#file-input-${uniqueId}`).on('change', `#file-input-${uniqueId}`, function (e) {
				var files = e.target.files;

				allimages.push(...files);
				var previewContainer = $(`#preview-container-${uniqueId}`);

				// Clear the preview container before appending new images
				previewContainer.empty();

				allimages.forEach((file, index) => {
					var reader = new FileReader();
					reader.onload = function (e) {
						var fileType = file.type;
						var element;

						if (fileType.startsWith('image/')) {
							// Image preview
							element = $('<img>').attr('src', e.target.result)
								.css({
									width: '100px',
									height: '100px',
									margin: '5px',
									border: '1px solid #ccc'
								});
						} else if (fileType.startsWith('video/')) {
							// Video thumbnail preview
							element = $('<video>').attr('src', e.target.result)
								.attr('controls', true) // Allows video control like play/pause
								.css({
									width: '100px',
									height: '100px',
									margin: '5px',
									border: '1px solid #ccc'
								});
						} else if (fileType === 'application/pdf') {
							// PDF icon for PDF files
							element = $('<img>').attr('src', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGAA4Wd4bco5Xv33GasXrnDdQT5OFXwa3HUQ&s') // Add path to a PDF icon
								.css({
									width: '100px',
									height: '100px',
									margin: '5px',
									border: '1px solid #ccc'
								});
						} else {
							// Generic file icon for other file types
							element = $('<img>').attr('src', 'https://w7.pngwing.com/pngs/521/255/png-transparent-computer-icons-data-file-document-file-format-others-thumbnail.png') // Add path to a generic file icon
								.css({
									width: '100px',
									height: '100px',
									margin: '5px',
									border: '1px solid #ccc'
								});
						}

						// Create the delete button
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
								element.remove();
								deleteButton.remove();
								allimages.splice(index, 1);
							});

						// Append the preview and delete button
						previewContainer.append(element).append(deleteButton);
					};
					reader.readAsDataURL(file);
				});

			});



		} else {
			frappe.confirm(
				'Are you sure you want to Complete this Task?',
				function () {
					uploadFilesAndCompleteTask([], taskId, frappe.session.user);
				}
			);
		}
	});


	function update_shift_data_templage(current_shift_type, project) {
		frappe.call({
			method: 'uvtech_hms.hms.page.task_list.task_list.update_shift_value',
			args: {
				shift: current_shift_type,
				location: project
			},
			callback: function (r) {
				frappe.dom.unfreeze();

			}
		})
	}

	function assignTasksTable(userId, shift, page, location_val) {
		frappe.call({
			method: 'uvtech_hms.hms.page.task_list.task_list.get_all_task_list',
			args: {
				user: frappe.session.user,
				employee_id: userId,
				shift_type: shift,
				project: location_val
			},
			callback: function (response) {
				let all_task_list = response.message.tasks;

				// Sort the tasks based on custom priority number
				all_task_list.sort((a, b) => {
					if (a.status === 'Completed' && b.status !== 'Completed') return 1;
    				if (a.status !== 'Completed' && b.status === 'Completed') return -1;
					if (a.custom_priority_no < b.custom_priority_no) return -1;
					if (a.custom_priority_no > b.custom_priority_no) return 1;
					return 0;
				});


				$('.displayTaskUpdateContainer').html(''); // Clear existing content

				// Render the new task list
				$(frappe.render_template('task_list', {
					data: all_task_list,
					total_tasks: response.message.total_tasks,
					total_completed_tasks: response.message.total_completed_tasks,
					total_pending_tasks: response.message.total_pending_tasks
				})).appendTo(page.body);
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
				// frappe.msgprint("Task has successfully completed")
				window.location.reload();
			},
			error: function (err) {
				frappe.msgprint(__('Error completing task.'));
			}
		});
	}



}