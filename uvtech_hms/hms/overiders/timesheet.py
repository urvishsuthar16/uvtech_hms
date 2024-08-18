import frappe
from frappe import _
from datetime import datetime

@frappe.whitelist()
def update_timesheet(doc, method=None):
    # Prevent recursion by checking if the function has already been run
    if doc.get('timesheet_updated'):
        return
    
    employee = doc.employee
    start_date = doc.start_date
    end_date = doc.end_date

    # Get list of Hms Attendance records within the date range
    hms_attendance = frappe.get_list(
        'Hms Attendance',
        filters={
            'employee': employee,
            'attendance_date': ['between', [start_date, end_date]]
        },
        fields=['name', 'in_time', 'out_time', 'attendance_date', 'employee', 'standard__rate']
    )
    
    total_hours = 0  # Initialize total hours
    total_amount = 0  # Initialize total amount
    
    # Loop through the attendance records
    for i in hms_attendance:
        # Check for duplicates directly in the timesheet table
        attendance_date_str = str(i.attendance_date)
        duplicate_entry = False
        for row in doc.timesheet_table:
            
            if row.attendance_date == attendance_date_str and row.employees == i.employee:
                duplicate_entry = True
                break

        if duplicate_entry:
            continue  # Skip if a duplicate entry is found
        
        # Calculate hours between in_time and out_time
        if i.in_time and i.out_time:
            from_time = i.in_time
            to_time = i.out_time
            hours = (to_time - from_time).total_seconds() / 3600  # Convert to hours
            total_hours = round(total_hours + hours, 2)
            
            # Convert standard__rate to float before multiplication
            standard_rate = float(i.standard__rate) if i.standard__rate else 0
            total_rate = round(standard_rate * hours, 2)
            
            total_amount = round(total_amount + total_rate, 2)
            
            # Append to timesheet table
            doc.append("timesheet_table", {
                "from_time": from_time,
                "to_time": to_time,
                "attendance_date": i.attendance_date,
                "employees": i.employee,
                "hours": hours,
                'amount' :total_rate
            })
    
    # Update the total hours and total amount fields
    doc.total_hours = total_hours
    doc.total_time =  total_amount
    
    # Mark that the timesheet has been updated to avoid recursion
    doc.timesheet_updated = True
    
    # Save without triggering events to avoid recursion
    doc.flags.ignore_events = True
    doc.save()
    doc.reload()  # Reload the document after saving
    doc.flags.ignore_events = False
