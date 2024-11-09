import frappe
import json
from datetime import date , datetime, timedelta
from frappe.utils import today, now

@frappe.whitelist()
def create_attendance(user, employee_id, shift_type, select_date_time):  

	existing_attendace = frappe.db.get_list('Hms Attendance',
            filters= {'emp_user':user,'attendance_date':select_date_time},
            fields=['in_time','name','working_hours','out_time','shift'],
            order_by='in_time asc',
        )
	shift_list = frappe.db.get_list('Shift Type', pluck='name',order_by="name asc")
	existing_attendace_shit = sorted([row.shift for row in existing_attendace if row.in_time and row.out_time])
	if shift_list == existing_attendace_shit:
		frappe.throw(f" All Shift Ended For Today")

	elif shift_type not in existing_attendace_shit:

		if existing_attendace:
			if existing_attendace[-1].out_time and shift_type == existing_attendace[-1].shift:
				frappe.throw(f'Attendance already Exist for today for this shift')
			else:
				select_date_time = datetime.strptime(select_date_time, "%Y-%m-%d %H:%M:%S")

				if existing_attendace[-1].in_time and shift_type == existing_attendace[-1].shift:
					time_difference = select_date_time - existing_attendace[-1].in_time
					if time_difference >= timedelta(hours=1):
						
						working_hours = time_difference.total_seconds() / 3600  # Convert seconds to hours
						
						
						# Update the Hms Attendance doctype with calculated values
						frappe.db.set_value('Hms Attendance', existing_attendace[-1].name, {
							'status': 'Present',
							'shift': shift_type,
							'out_time': select_date_time,
							'working_hours': working_hours,
							
						})
						return True
					
					else:
						frappe.throw("Out time must be at least one hour after in time.")

				elif shift_type != existing_attendace[-1].shift:
					hms_attendance = frappe.get_doc({
						'doctype': 'Hms Attendance',
						'employee': employee_id,
						'status': 'Present',
						'shift': shift_type,
						'in_time': select_date_time,
						"attendance_date": select_date_time
						})
					hms_attendance.insert(ignore_permissions=True)
					return True
		else:
			hms_attendance = frappe.get_doc({
			'doctype': 'Hms Attendance',
			'employee': employee_id,
			'status': 'Present',
			'shift': shift_type,
			'in_time': select_date_time,
			'attendance_date':select_date_time
			})
			hms_attendance.insert(ignore_permissions=True)
			return True
	else:
		frappe.throw(f"Attendance already Exist for today for this shift")



@frappe.whitelist()
def get_running_attendance(employee_id):
    attendance = frappe.db.get_value('Hms Attendance', {
			'employee': employee_id,  # Use the correct field name
			'out_time': None  # Assuming you want to find running (active) attendance
		}, ['name', 'in_time', 'shift'])

			
    if attendance:
        return attendance
    return None
