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


	// Add a button to the page
	// Add Start Time button
     // Add Start Time button
	 let button_start = page.add_field({
        label: 'Start Time',
        fieldtype: 'Button',
        fieldname: 'start_time'
    });

    button_start.$input.on('click', function() {
        // Function to pad numbers to two digits
        function pad(number) {
            return number < 10 ? '0' + number : number;
        }

        // Get current date and time
        let now = new Date();
        let day = pad(now.getDate());
        let month = pad(now.getMonth() + 1); // Months are 0-indexed
        let year = now.getFullYear();
        let hours = pad(now.getHours());
        let minutes = pad(now.getMinutes());
        let seconds = pad(now.getSeconds());

        // Format current time as YYYY-MM-DD HH:MM:SS
        let formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        let shift_filter = shift_filter_field.get_value();
        let emp_id = employee_field.get_value();
        let attendance_date = `${year}-${month}-${day}`;

        // Query the database to check for existing attendance record
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Hms Attendance',
                filters: {
                    employee: emp_id,
                    attendance_date: attendance_date,
                    shift: shift_filter
                },
                fields: ['name', 'out_time'],
                limit_page_length: 1
            },
            callback: function(response) {
                if (response.message && response.message.length > 0) {
                    // Document already exists
                    let existingDoc = response.message[0];
                    if (!existingDoc.out_time) {
                        frappe.msgprint(__('Attendance record for today already started. End Time not set.'));
                    } else {
                        frappe.msgprint(__('Attendance record for today already exists.'));
                    }
                } else {
                    // Create a new document if none exists
                    frappe.call({
                        method: 'frappe.client.insert',
                        args: {
                            doc: {
                                doctype: 'Hms Attendance',
                                employee: emp_id,
                                in_time: formattedTime,
                                attendance_date: attendance_date,
                                shift: shift_filter
                            }
                        },
                        callback: function(response) {
                            if (!response.exc) {
                                frappe.msgprint(`Start Time recorded: ${formattedTime}`); // Show success message
                            } else {
                                frappe.msgprint(__('Error creating the document.'));
                            }
                        }
                    });
                }
            }
        });
    });

    // Add End Time button
    let button_end = page.add_field({
        label: 'End Time',
        fieldtype: 'Button',
        fieldname: 'end_time'
    });

    button_end.$input.on('click', function() {
        // Function to pad numbers to two digits
        function pad(number) {
            return number < 10 ? '0' + number : number;
        }

        // Get current date and time
        let now = new Date();
        let day = pad(now.getDate());
        let month = pad(now.getMonth() + 1); // Months are 0-indexed
        let year = now.getFullYear();
        let hours = pad(now.getHours());
        let minutes = pad(now.getMinutes());
        let seconds = pad(now.getSeconds());

        // Format current time as YYYY-MM-DD HH:MM:SS
        let formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        let attendance_date = `${year}-${month}-${day}`;
        let emp_id = employee_field.get_value();

        // Query the database to find the existing attendance record
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Hms Attendance',
                filters: {
                    employee: emp_id,
                    attendance_date: attendance_date
                },
                fields: ['name', 'in_time', 'out_time'],
                limit_page_length: 1
            },
            callback: function(response) {
                if (response.message && response.message.length > 0) {
                    // Document exists, update the end time
                    let existingDoc = response.message[0];
                    if (!existingDoc.out_time) {
                        // Calculate total time
                        let startTime = new Date(existingDoc.in_time);
                        let endTime = new Date(formattedTime);
                        let totalMilliseconds = endTime - startTime;
                        let totalHours = Math.floor(totalMilliseconds / (1000 * 60 * 60)); // Total time in hours
                        let totalMinutes = Math.floor((totalMilliseconds % (1000 * 60 * 60)) / (1000 * 60)); // Remaining minutes

                        frappe.call({
                            method: 'frappe.client.set_value',
                            args: {
                                doctype: 'Hms Attendance',
                                name: existingDoc.name,
                                fieldname: 'out_time',
                                value: formattedTime
                            },
                            callback: function(response) {
                                if (!response.exc) {
                                    // Update total time
                                    frappe.call({
                                        method: 'frappe.client.set_value',
                                        args: {
                                            doctype: 'Hms Attendance',
                                            name : existingDoc.name,
                                            value : `${totalHours} hours ${totalMinutes} minutes`
                                        },
                                        callback: function(response) {
                                            if (!response.exc) {
                                                frappe.msgprint(`End Time recorded: ${formattedTime}. Total Time: ${totalHours} hours ${totalMinutes} minutes`); // Show success message
                                            } else {
                                                frappe.msgprint(__('Error updating total time.'));
                                            }
                                        }
                                    });
                                } else {
                                    frappe.msgprint(__('Error updating the document.'));
                                }
                            }
                        });
                    } else {
                        frappe.msgprint(__('End Time already set for today.'));
                    }
                } else {
                    frappe.msgprint(__('No attendance record found for today.'));
                }
            }
        });
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

	// $(page.body).on('click', '.btn-primary', function (e) {
	// 	var taskId = e.target.id;
	// 	var dialog = new frappe.ui.Dialog({
	// 		title: 'Upload File and Complete Task',
	// 		fields: [
	// 			{
	// 				fieldname: 'image_box',
	// 				fieldtype: 'HTML',
	// 				options: 
	// 										<input type="file" id="file-input" multiple />
	// 										<div id="preview-container" style="margin-top: 10px;">
	// 												<!-- Image previews will be inserted here -->
	// 										</div>
	// 								
	// 			}
	// 		],
	// 		primary_action_label: 'Complete',
	// 		primary_action: function () {
	// 			// Collect the file inputs
	// 			var fileInputs = document.getElementById('file-input').files;
	// 			var fileslist = [];
	// 			if (fileInputs.length > 0) {
	// 				Array.from(fileInputs).forEach(file => {
	// 					fileslist.push(file.name);
	// 				});
	// 				convertFilesToBlobsAndUpload(fileInputs, taskId, frappe.session.user);
	// 			} else {
	// 				console.log('No images uploaded.');
	// 				uploadFilesAndCompleteTask([], taskId, frappe.session.user);
	// 			}

	// 			dialog.hide();
	// 		}
	// 	});

	// 	// Show the dialog
	// 	dialog.show();
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

				}
			],
			primary_action_label: 'Complete',
			primary_action: function () {
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