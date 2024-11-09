frappe.ui.form.on('Employee', {
    refresh(frm) {
        if (frm.doc.custom_employee_rates.length === 0) {
            
            // Define the weekdays
            let week_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            
            // Iterate over each weekday and add it to the child table
            week_days.forEach(week_day => {
                let row = frm.add_child('custom_employee_rates');
                row.day = week_day; 
                row.standard_rate = frm.doc.custom_standard_rate;
                row.extra_rate = frm.doc.custom_extra_rate;
                row.standard_hours = frm.doc.custom_standard_hours;
            });
            
            // Refresh the child table field to show the new rows
            frm.refresh_field('custom_employee_rates');
        }

        frm.set_df_property('custom_employee_rates', 'cannot_add_rows', true); // Hide add row button
        frm.set_df_property('custom_employee_rates', 'cannot_delete_rows', true); // Hide delete button
        frm.set_df_property('custom_employee_rates', 'cannot_delete_all_rows', true)
    },
    
    // Trigger when custom_standard_hours is changed
    custom_standard_hours(frm) {
        frm.doc.custom_employee_rates.forEach(row => {
            row.standard_hours = frm.doc.custom_standard_hours;
        });
        frm.refresh_field('custom_employee_rates');
    },

    // Trigger when custom_standard_rate is changed
    custom_standard_rate(frm) {
        frm.doc.custom_employee_rates.forEach(row => {
            row.standard_rate = frm.doc.custom_standard_rate;
        });
        frm.refresh_field('custom_employee_rates');
    },

    // Trigger when custom_extra_rate is changed
    custom_extra_rate(frm) {
        frm.doc.custom_employee_rates.forEach(row => {
            row.extra_rate = frm.doc.custom_extra_rate;
        });
        frm.refresh_field('custom_employee_rates');
    }
});
