frappe.ui.form.on('Task', {
    refresh(frm) {
        // Initialize base HTML
        let base_html = `<div style="display: flex; flex-wrap: wrap;">`;

        // Loop through each custom image and append the HTML
        for (let row of frm.doc.custom_images) {
            let file_path = row.images;
            let file_extension = file_path.split('.').pop().toLowerCase(); // Get file extension
            let file_html;
        
            if (['jpg', 'jpeg', 'png', 'gif'].includes(file_extension)) {
                // Image preview
                file_html = `<a href="${file_path}" target="_blank" style="margin: 5px;">
                                <img src="${file_path}" alt="Image" style="height: 240px; width: auto;"/>
                             </a>`;
            } else if (['mp4', 'webm', 'ogg'].includes(file_extension)) {
                // Video preview
                file_html = `<a href="${file_path}" target="_blank" style="margin: 5px;">
                                <video src="${file_path}" controls style="height: 240px; width: auto;">
                                    Your browser does not support the video tag.
                                </video>
                             </a>`;
            } else if (file_extension === 'pdf') {
                // PDF preview (PDF icon with link)
                file_html = `<a href="${file_path}" target="_blank" style="margin: 5px;">
                                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGAA4Wd4bco5Xv33GasXrnDdQT5OFXwa3HUQ&s" alt="PDF" style="height: 240px; width: auto;"/>
                             </a>`;
            } else {
                // Generic file icon preview
                file_html = `<a href="${file_path}" target="_blank" style="margin: 5px;">
                                <img src="https://w7.pngwing.com/pngs/521/255/png-transparent-computer-icons-data-file-document-file-format-others-thumbnail.png" alt="File" style="height: 240px; width: auto;"/>
                             </a>`;
            }
        
            base_html += file_html;
        }
        

        // Close the base HTML div
        base_html += `</div>`;

        // Set the custom_preview field with the constructed HTML
        // frm.set_value('custom_preview', base_html);
        frm.set_df_property('custom_preview', 'options', base_html)
        
    }
});
