frappe.ui.form.on('Hms Attendance', {
    // refresh(frm) {
    //     calculate_total_hours(frm);
    // },
    
    in_time(frm) {
        calculate_total_hours(frm);
    },
    
    out_time(frm) {
        calculate_total_hours(frm);
    },
    employee(frm){
        console.log(frm.doc.employee)
        frappe.db.get_value(
			"Employee",
			{ name: frm.doc.employee },
			"default_shift",
			(r) => {
				if (r && r.default_shift) {
					frm.set_value('shift', r.default_shift)
				}else{
                    frm.set_value('shift', '')

                }
			}
		);
    }

});

function calculate_total_hours(frm) {
    if (frm.doc.in_time && frm.doc.out_time) {
        let start_time = moment(frm.doc.in_time);
        let end_time = moment(frm.doc.out_time);

        // Calculate the duration in hours
        let hours = moment.duration(end_time.diff(start_time)).asHours();

        // Set the total hours to the working_hours field
        frm.set_value('working_hours', hours);

        // frm.save();

        console.log("Total Working Hours:", hours);
    }
}
