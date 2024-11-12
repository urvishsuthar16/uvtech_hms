import frappe
import json
from datetime import date , datetime, timedelta
from frappe.utils import today, now

@frappe.whitelist()
def create_attendance(user, employee_id, shift_type, select_date_time):
    # Convert select_date_time to datetime if it's a string
    if isinstance(select_date_time, str):
        select_date_time = datetime.strptime(select_date_time, '%Y-%m-%d %H:%M:%S')
    
    # Get existing attendance records for today with the same shift
    existing_shift_attendance = frappe.db.get_list(
        'Hms Attendance',
        filters={
            'emp_user': user,
            'attendance_date': select_date_time.date(),
            'shift': shift_type
        },
        fields=['in_time', 'out_time'],
        order_by='in_time asc',
    )

    # If there’s already a record for this shift today, block further attendance creation
    if existing_shift_attendance:
        frappe.throw("Attendance already exists for this shift today.")

    # Otherwise, create a new attendance record for this shift and day
    hms_attendance = frappe.get_doc({
        'doctype': 'Hms Attendance',
        'employee': employee_id,
        'status': 'Present',
        'shift': shift_type,
        'in_time': select_date_time,
        'attendance_date': select_date_time.date()
    })
    hms_attendance.insert(ignore_permissions=True)
    return True  # Return True to indicate success




@frappe.whitelist()
def get_running_attendance(employee_id):
    attendance = frappe.db.get_value('Hms Attendance', {
			'employee': employee_id,  
			'out_time': None ,
            'status': 'Present'
		}, ['name', 'in_time', 'shift'])

			
    if attendance:
        return attendance
    return None




@frappe.whitelist()
def update_attendance(user, employee_id, shift_type, select_date_time):
    # Convert select_date_time from string to datetime format
    select_date_time = datetime.strptime(select_date_time, '%Y-%m-%d %H:%M:%S')
    
    # Retrieve existing attendance record with no out_time
    attendance = frappe.db.get_value('Hms Attendance', {
        'employee': employee_id,
        'out_time': None
    }, ['name', 'in_time', 'shift'])
    
    if attendance:
        in_time = attendance[1]  # Since in_time is already a datetime object
        
        # Calculate time difference in hours
        time_difference = select_date_time - in_time
        working_hours = time_difference.total_seconds() / 3600
        
        # Update attendance record with out_time, working_hours, and status
        frappe.db.set_value('Hms Attendance', attendance[0], {
            'out_time': select_date_time,
            'working_hours': working_hours,
        })
        
        # Return True if successful
        return True
    
    else:
        frappe.throw("No running attendance record found for the employee.")
