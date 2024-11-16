frappe.pages['hms-checkin'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Employee Checkin',
		single_column: true
	});

	let current_employee_id = null;
	let userId = null;
	let employee_name = null;
	let status = 'Stopped';

	// Add button container with centered, round buttons
	let button_container = $(`
        <div class="button-container" style="padding: 15px; text-align: center;">
            <div class="form-group">
                <button class="btn btn-primary btn-start" style="border-radius: 50%; width: 100px; height: 100px; font-size: 16px;">Start</button>
                <button class="btn btn-danger btn-stop" style="display: none; border-radius: 50%; width: 100px; height: 100px; font-size: 16px;">Stop</button>
            </div>
            <div id="status-message" style="margin-top: 15px; font-size: 18px; color: green;">Status: ${status}</div>
        </div>
    `).appendTo(page.body);

	// Employee fields
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
	});

	let select_date_time = page.add_field({
		label: 'Select Time',
		fieldtype: 'Datetime',
		fieldname: 'select_date',
		default: "Now",
		reqd: 1
	});

	// Fetch employee data and existing attendance status on page load
	frappe.db.get_value('Employee', { user_id: frappe.session.user }, ['name', "default_shift", "employee_name"])
		.then(response => {
			userId = response.message.name;

			employee_field.set_value(userId);
			current_employee_id = userId;
			employee_name_field.set_value(response.message.employee_name);

			// Check for existing attendance record
			if (response.message.employee_name){
				check_running_attendance(userId);

			}
		});

	// Start button event with animation and status update
	button_container.find('.btn-start').on('click', async function () {
		let employeeName = employee_field.get_value();
		let shiftType = shift_filter_field.get_value();
		let select_date = select_date_time.get_value();

		if (!employeeName) {
			frappe.msgprint(__('Please select a valid Employee.'));
			return;
		}

		if (!shiftType) {
			frappe.msgprint(__('Please select a valid Shift Type.'));
			return;
		}
		if (!select_date) {
			frappe.msgprint(__('Please select a Date Time.'));
			return;
		}
		// Call attendance creation function
		try {
			let result = await create_attendance(frappe.session.user, employeeName, shiftType, select_date, 'start');

			// CSS Animation Example: Change background color for success
			$(this).css("background-color", "lightgreen").animate({ backgroundColor: "#28a745" }, 1000);
			shift_filter_field.$input.attr('readonly', true);
			status = 'Running...';
			update_status('green', status);

			$(this).fadeOut(500, function () {
				button_container.find('.btn-stop').fadeIn(500);
			});
		} catch (error) {
			console.error('Error starting attendance:', error);
			// You could add error handling animations here as well
		}
	});

	// Stop button event with animation and status update
	button_container.find('.btn-stop').on('click', async function () {
		let employeeName = employee_field.get_value();
		let select_date = new Date(select_date_time.get_value());  // Convert select_date to Date object
		frappe.call({
			method: 'uvtech_hms.hms.page.hms_checkin.hms_checkin.get_running_attendance',
			args: {
				employee_id: employeeName,
			},
			callback: function (response) {
				if (response.message) {
					let in_time = new Date(Date.parse(response.message[1]));  // Parse in_time to Date object

					let timeDifference = select_date - in_time;
					let oneHourInMilliseconds = 60 * 60 * 1000; // 1 hour in milliseconds

					if (timeDifference >= oneHourInMilliseconds) {
						frappe.confirm(
							'Are you sure you want to complete the shift?',
							async () => {
								try {
									let result = await close_the_attendance(frappe.session.user, employeeName, shift_filter_field.get_value(), select_date_time.get_value(), 'stop');
									shift_filter_field.$input.attr('readonly', false);

									button_container.find('.btn-stop').css("background-color", "lightcoral").animate({ backgroundColor: "#dc3545" }, 1000);

									button_container.find('.btn-stop').fadeOut(500, function () {
										button_container.find('.btn-start').fadeIn(500);
									});

									status = 'Stopped';
									update_status('red', status);

								} catch (error) {
									console.error('Error stopping attendance:', error);
								}
							}
						);
					} else {
						frappe.throw("Out time must be at least one hour after in time.");
					}
				}
			}
		});
	});

	
	function update_status(color, statusText) {
		$('#status-message').css('color', color).text(`Status: ${statusText}`);
	}

	function check_running_attendance(employee_id) {
		frappe.call({
			method: 'uvtech_hms.hms.page.hms_checkin.hms_checkin.get_running_attendance',
			args: {
				employee_id: employee_id
			},
			callback: function (response) {
				if (response.message) {
					let attendance = response.message;
					shift_filter_field.$input.attr('readonly', true);
					// Set the shift and show stop button
					shift_filter_field.set_value(attendance[2]);
					status = 'Running...';
					update_status('green', status);

					button_container.find('.btn-start').hide();
					button_container.find('.btn-stop').show();
				}
			}
		});
	}
};


// Function to create attendance and pass action (start/stop)
function create_attendance(userId, employee_id, shift_type, select_date_time, action) {
	return new Promise((resolve, reject) => {
		frappe.call({
			method: 'uvtech_hms.hms.page.hms_checkin.hms_checkin.create_attendance',
			args: {
				user: userId,
				employee_id: employee_id,
				shift_type: shift_type,
				action: action,
				select_date_time: select_date_time
			},
			callback: function (response) {
				if (response.message) {
					resolve(response.message);
				} else {
					reject('No response from server.');
				}
			},
			error: function (error) {
				console.error('Error:', error);
				reject(error);
			}
		});
	});
}

function close_the_attendance(userId, employee_id, shift_type, select_date_time, action) {
	return new Promise((resolve, reject) => {
		frappe.call({
			method: 'uvtech_hms.hms.page.hms_checkin.hms_checkin.update_attendance',
			args: {
				user: userId,
				employee_id: employee_id,
				shift_type: shift_type,
				action: action,
				select_date_time: select_date_time
			},
			callback: function (response) {
				if (response.message) {
					resolve(response.message);
				} else {
					reject('No response from server.');
				}
			},
			error: function (error) {
				console.error('Error:', error);
				reject(error);
			}
		});
	});
}