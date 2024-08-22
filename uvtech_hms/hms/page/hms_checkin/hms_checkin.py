import frappe
import json
from datetime import date , datetime
from frappe.utils import today, now

@frappe.whitelist()
def create_attendance(user, employee_id, shift_type):
    # existing_attendace = frappe.db.get_value('Hms Attendance',
    #     {'emp_user':user,'attendance_date':today(),
    #      "shift":shift_type},['in_time','name','working_hours','out_time','shift'])
    

	existing_attendace = frappe.db.get_list('Hms Attendance',
            filters= {'emp_user':user,'attendance_date':now()},
            fields=['in_time','name','working_hours','out_time','shift'],
            order_by='in_time asc',
        )
	shift_list = frappe.db.get_list('Shift Type', pluck='name',order_by="name asc")
	existing_attendace_shit = sorted([row.shift for row in existing_attendace if row.in_time and row.out_time])
	if shift_list == existing_attendace_shit:
		frappe.throw(f" All Shift Ended For Today{shift_list == existing_attendace_shit}")
			  
	if existing_attendace:
		if existing_attendace[-1].out_time and shift_type == existing_attendace[-1].shift:
					frappe.throw(f'Attendance already Exist for today for this shift')
		else:
			if existing_attendace[-1].in_time and shift_type == existing_attendace[-1].shift:
				frappe.db.set_value('Hms Attendance', existing_attendace[-1].name, {
					'status': 'Present',
					'shift': shift_type,
					'out_time': now()
				})
			elif not existing_attendace[-1].get("out_time") and shift_type != existing_attendace[-1].shift:
				frappe.throw(f'End other Shift to start this one')

			elif shift_type != existing_attendace[-1].shift:
				hms_attendance = frappe.get_doc({
					'doctype': 'Hms Attendance',
					'status': 'Present',
					'shift': shift_type,
					'in_time': now()
					})
				hms_attendance.insert(ignore_permissions=True)

	else:
		hms_attendance = frappe.get_doc({
		'doctype': 'Hms Attendance',
		'status': 'Present',
		'shift': shift_type,
		'in_time': now()
		})
		hms_attendance.insert(ignore_permissions=True)

		# if len(existing_attendace) == 2:
		# 	if existing_attendace[1].out_time:
		# 		frappe.throw(f'Attendance already Exist for today for this shift for both shift')
		# 	else:
		# 		if existing_attendace[1].in_time and not existing_attendace[1].get("out_time") and shift_type == existing_attendace[1].shift:
		# 			# frappe.throw("wrong")
		# 			frappe.db.set_value('Hms Attendance', existing_attendace[0].name, {
		# 				'status': 'Present',
		# 				'shift': shift_type,
		# 				'out_time': now()
		# 			})
