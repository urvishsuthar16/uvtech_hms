frappe.ui.form.on('Hms Timesheet', {
    refresh: function(frm) {
        frm.set_df_property('timesheet_table', 'cannot_add_rows', true); // Hide add row button
        frm.set_df_property('timesheet_table', 'cannot_delete_rows', true); // Hide delete button
        frm.set_df_property('timesheet_table', 'cannot_delete_all_rows', true); // Hide delete all button
     },
    onload_post_render(frm) {
        if (frm.is_new()) {

            let today = frappe.datetime.nowdate();  // Get the current date
            let day_of_week = frappe.datetime.str_to_obj(today).getDay();  // Get the day of the week (0 = Sunday, 6 = Saturday)

            // Calculate the start date (Monday)
            let start_date = frappe.datetime.add_days(today, day_of_week === 0 ? -6 : (1 - day_of_week));

            // Calculate the end date (Sunday)
            let end_date = frappe.datetime.add_days(start_date, 6);

            // Set the start_date and end_date fields
            frm.set_value('start_date', start_date);
            frm.set_value('end_date', end_date);
        }
    },

    refresh_btn(frm) {
        frappe.db.get_value('Employee', frm.doc.employee, ['custom_extra_rate', 'custom_standard_rate', 'employee_name'])
            .then(r => {
                const employee = r.message;

                // Check if custom_extra_rate and custom_standard_rate are greater than 0
                if ((employee.custom_extra_rate <= 0 || !employee.custom_extra_rate) ||
                    (employee.custom_standard_rate <= 0 || !employee.custom_standard_rate)) {

                    // Show a notification or validation message
                    frappe.msgprint(__(`Please Add Standard Rate and Extra Rate value to ${employee.employee_name} Employee`), __('Validation'));

                    // Prevent saving the form if conditions are not met
                    frappe.validated = false;
                } else {
                    frm.save()
                }
            });

    },
    before_save: async function (frm) {
        // Fetch the Employee record based on employee ID
        let res = await frappe.db.get_value('Employee', frm.doc.employee, ['custom_extra_rate', 'custom_standard_rate', 'employee_name'])
            .then(r => {
                const employee = r.message;

                // Check if custom_extra_rate and custom_standard_rate are greater than 0
                if ((employee.custom_extra_rate <= 0 || !employee.custom_extra_rate) ||
                    (employee.custom_standard_rate <= 0 || !employee.custom_standard_rate)) {

                    // Show a notification or validation message
                    frappe.msgprint(__(`Please Add Standard Rate and Extra Rate value to ${employee.employee_name} Employee`), __('Validation'));

                    // frappe.validated = false;
                    return false
                } else{
                    return true
                }
            });
            frappe.validated = res;
    }
});

frappe.ui.form.on('timesheet table', {
    standard_rate(frm, cdt, cdn) {
        get_total(frm, cdt, cdn)
    },
    extra_rate(frm, cdt, cdn) {
        get_total(frm, cdt, cdn)
    }
})

function get_total(frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    row.standard_amount = row.standard_rate * row.standard_hours
    row.extra_amount = row.extra_rate * row.extra_hours
    row.amount = row.standard_amount + row.extra_amount
    frm.refresh_field('timesheet_table')
}
