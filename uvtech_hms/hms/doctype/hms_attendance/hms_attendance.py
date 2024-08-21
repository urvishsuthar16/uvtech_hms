# Copyright (c) 2024, gg and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class HmsAttendance(Document):

	def validate(self):
		if self.out_time and self.in_time :
			total_working_hours = frappe.utils.time_diff_in_hours(self.out_time,self.in_time)
			standard_working_hours = frappe.db.get_value('Employee',self.employee,'custom_standard_hours')
			self.working_hours  = total_working_hours
			
			if total_working_hours > standard_working_hours:
				self.standard_hours = standard_working_hours
				self.extra_hours = total_working_hours - standard_working_hours
			elif total_working_hours < standard_working_hours:
				self.standard_hours = total_working_hours
				self.extra_hours = 0
