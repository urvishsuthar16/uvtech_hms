import frappe
import json
from datetime import date , datetime
from frappe.utils import today, now

@frappe.whitelist()
def create_attendance(user, employee_id, shift_type):
    existing_attendace = frappe.db.get_value('Hms Attendance',{'emp_user':user,'attendance_date':today()},['in_time','name','working_hours'])
    if existing_attendace and existing_attendace[2] == 0:
        frappe.db.set_value('Hms Attendance', existing_attendace[1], {
			'status': 'Present',
			'shift': shift_type,
			'out_time': now()
        })
    # elif existing_attendace[2]>0:
    #     frappe.throw("Attendance already Exist")
    else:
        hms_attendance = frappe.get_doc({
            'doctype': 'Hms Attendance',
            'status': 'Present',
			'shift': shift_type,
			'in_time': now()
        })
        hms_attendance.insert(ignore_permissions=True)
