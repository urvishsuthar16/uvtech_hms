frappe.ui.form.on('Hms Timesheet', {
    onload_post_render(frm) {
        let today = frappe.datetime.nowdate();  // Get the current date
        let day_of_week = frappe.datetime.get_day_diff(today, frappe.datetime.add_days(today, 1)); // Get the day of the week (0 = Monday, 6 = Sunday)

        // Calculate the start and end dates
        let start_date = frappe.datetime.add_days(today, -day_of_week);
        let end_date = frappe.datetime.add_days(start_date, 6);

        // Set the start_date and end_date fields
        frm.set_value('start_date', start_date);
        frm.set_value('end_date', end_date);
    }
});
