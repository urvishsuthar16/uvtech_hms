frappe.pages['hms-attendance-list'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Attendance',
		single_column: true
	});

	let current_employee_id = null;
	let current_shift_type = null;
	let userId = null;
	let employee_name = null;
	var currentHour = new Date().getHours();
	let allimages = [];

	// Create a custom container for the buttons inside the page body
	let button_container = $(`
		<div class="button-container" style="padding: 15px;">
			<div class="form-group">
				<button class="btn btn-primary btn-start">Start Time</button>
				<button class="btn btn-primary btn-end" style="display: none;">End Time</button>
			</div>
		</div>
	`).appendTo(page.body);  // Append the container to page body

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

	// Handle Start Time button click
	button_container.find('.btn-start').on('click', function() {
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
								// attendance_date: attendance_date,
								shift: shift_filter
							}
						},
						callback: function(response) {
							if (!response.exc) {
								frappe.msgprint(`Start Time recorded: ${formattedTime}`); // Show success message

								// Hide Start button and show End button
								button_container.find('.btn-start').hide();
								button_container.find('.btn-end').show();
							} else {
								frappe.msgprint(__('Error creating the document.'));
							}
						}
					});
				}
			}
		});
	});

	// Handle End Time button click
	button_container.find('.btn-end').on('click', function() {
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
				fields: ['name', 'in_time', 'out_time','working_hours'],
				limit_page_length: 1
			},
			callback: function(response) {
				if (response.message && response.message.length > 0) {
					// Document exists, update the end time
					let existingDoc = response.message[0];
					if (!existingDoc.working_hours) {
						// Calculate total time
						let startTime = new Date(existingDoc.in_time);
						let endTime = new Date(formattedTime);
						let totalMilliseconds = endTime - startTime;
						let totalHours = Math.floor(totalMilliseconds / (1000 * 60 * 60)); // Total time in hours
						let totalMinutes = Math.floor((totalMilliseconds % (1000 * 60 * 60)) / (1000 * 60)); // Remaining minutes
						let formattedWorkingHours = `${pad(totalHours)}:${pad(totalMinutes)}`;
	
						// Update the document with end time and working hours
						frappe.db.set_value('Hms Attendance', existingDoc.name, {
							out_time: formattedTime,
							// working_hours: formattedWorkingHours
						}).then(response => {
							if (!response.exc) {
								frappe.msgprint(`End Time recorded: ${formattedTime}. `);
								button_container.find('.btn-end').hide();
							} else {
								frappe.msgprint(__('Error updating attendance record.'));
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
		});
}
