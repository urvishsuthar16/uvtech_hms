frappe.pages['hms-checkin'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Employee Checkin',
		single_column: true
	});
	let current_employee_id = null;
	let current_shift_type = null;
	let userId = null;
	let employee_name = null;
	var currentHour = new Date().getHours();

	// create_attendance(frappe.session.user, employee_name_field.get_value(), shift_filter_field.get_value())

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

	button_container.find('.btn-start').on('click', function() {
		let currentTime = frappe.datetime.now_time();

		// frappe.db.insert({
			// doctype: 'Hms Attendance',
			// status: 'Present',
			// shift: shift_filter_field.get_value(),
			// in_time: currentTime
		// }).then(doc => {
		// 	console.log(doc);
		// });
		
		create_attendance(frappe.session.user, employee_name_field.get_value(), shift_filter_field.get_value())

		frappe.msgprint(`Start Time recorded: ${currentTime}`);

		button_container.find('.btn-start').hide();
		button_container.find('.btn-end').show();
	});


	// Handle End Time button click
	button_container.find('.btn-end').on('click', function() {
		let currentTime = frappe.datetime.now_time();
		create_attendance(frappe.session.user, employee_name_field.get_value(), shift_filter_field.get_value())
		frappe.msgprint(`End Time recorded: ${currentTime}`); // Show success message

		// Hide Start button and show End button
		button_container.find('.btn-start').hide();
		button_container.find('.btn-end').show();
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
					primary_action_label: 'Confirm',
					primary_action: function () {
						current_shift_type = shift_dialog.get_value('shift_type');
						shift_dialog.hide();
						shift_filter_field.set_value(current_shift_type);
					}
				});

				shift_dialog.show();
			}
		});
}

function create_attendance(userId, employee_id, shift_type) {
	let today = frappe.datetime.get_today();

	frappe.call({
		method: 'uvtech_hms.hms.page.hms_checkin.hms_checkin.create_attendance',
		args: {
			user: frappe.session.user,
			employee_id: employee_id,
			shift_type: shift_type
		},
		callback: async function (response) {
			console.log(response)
		},
		error: function (err) {
			// frappe.msgprint(__('Error retrieving attendance'));
		}
	});
}