app_name = "uvtech_hms"
app_title = "UV tech"
app_publisher = "gg"
app_description = "Uv"
app_email = "govindgupta78090@gmail.com"
app_license = "mit"
# required_apps = []

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/uvtech_hms/css/uvtech_hms.css"
# app_include_js = "/assets/uvtech_hms/js/uvtech_hms.js"

# include js, css files in header of web template
# web_include_css = "/assets/uvtech_hms/css/uvtech_hms.css"
# web_include_js = "/assets/uvtech_hms/js/uvtech_hms.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "uvtech_hms/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {"Task" : "public/js/task.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "uvtech_hms/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "uvtech_hms.utils.jinja_methods",
# 	"filters": "uvtech_hms.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "uvtech_hms.install.before_install"
# after_install = "uvtech_hms.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "uvtech_hms.uninstall.before_uninstall"
# after_uninstall = "uvtech_hms.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "uvtech_hms.utils.before_app_install"
# after_app_install = "uvtech_hms.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "uvtech_hms.utils.before_app_uninstall"
# after_app_uninstall = "uvtech_hms.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "uvtech_hms.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events


doc_events = {
	"Task": {
		"validate": "uvtech_hms.hms.overiders.utilis.task_priority",
		# "on_cancel": "method",
		# "on_trash": "method"
	}
}
# "Hms Timesheet" :{
#     "validate" : "uvtech_hms.hms.doctype.hms_timesheet.hms_timesheet.update_timesheet"

# 	}
# }

# Scheduled Tasks
# ---------------

scheduler_events = {
    
# # 	"all": [
# # 		"uvtech_hms.tasks.all"
# # 	],
		"cron":{
			
			"0 */4 * * *": [
				"uvtech_hms.hms.overiders.utilis.remove_default_shift"
			],
		},
        "hourly": [
				"uvtech_hms.hms.overiders.utilis.test_time"
		],
# # 	"daily": [
# # 		"uvtech_hms.tasks.daily"
# # 	],
# # 	"hourly": [
# # 		"uvtech_hms.tasks.hourly"
# # 	],
# # 	"weekly": [
# # 		"uvtech_hms.tasks.weekly"
# # 	],
# # 	"monthly": [
# # 		"uvtech_hms.tasks.monthly"
# # 	],
}

# Testing
# -------

# before_tests = "uvtech_hms.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "uvtech_hms.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "uvtech_hms.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["uvtech_hms.utils.before_request"]
# after_request = ["uvtech_hms.utils.after_request"]

# Job Events
# ----------
# before_job = ["uvtech_hms.utils.before_job"]
# after_job = ["uvtech_hms.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"uvtech_hms.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

fixtures = [

	{"dt": "Custom Field", "filters": [
		[
			"module", "in", [
				
                "hms"
			]
		]
	]},
    {"dt": "Shift Type", "filters": [
		[
			"name", "in", [
                'Evening',
                'Morning'
				
			]
		]
	]},
    {"dt": "Property Setter", "filters": [
        [
			"module", "in", [
                "hms"
			]
		]
	]},


]