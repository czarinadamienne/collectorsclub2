let postId;

function formatDate(date) {
    const pad = (n) => (n < 10 ? '0' + n : n);
    const d = new Date(date);
    const formattedDate = `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    return formattedDate;
}

$(document).ready(function () {
        let comuser;
        let realcom;
        $(document).on("click", "#postcomment", async function(event){
            event.preventDefault();
            const query = new URLSearchParams(window.location.search);
            const loguser = query.get('loguser');
            const postId = $(this).closest('.add-comment').data('ccom');
            
            var newCommentText = $(this).closest('.add-comment').find('#newComment').val().trim();
            if (newCommentText === '') {
                alert('Please enter a comment.');
                return;
            }
        
            const fdata = {postId, loguser, newCommentText};
        
            try {
                const res = await fetch('/commentprof', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(fdata),
                });
        
                if (res.ok) {
                    const data = await res.json();
                    comuser = data.userId; 
                    logname = data.username;
                    
                } else {
                    throw new Error('Network response was not ok.');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        
            var username = logname;
            var commentWithUsername = username + ': ' + newCommentText;
        
            var newCommentElement = $('<div>').addClass('commarea');
        
            var userLink = $('<a>').attr('href', '/profile?userid=<%= comment.user._id %>&loguser=<%= loguser._id %>').attr('id', 'comlink').text(username);
            newCommentElement.append(userLink);
        
            newCommentElement.append(': ', $('<span>').addClass('newcommenttext').text(newCommentText));
        
            var options = $('<img>').attr({
                src: "./images/dots.png",
                alt: "Options"
            }).addClass('options-button-com');
        
            var optionsPopup = $('<div>').addClass('options-popup-com').css('display', 'none');
        
            newCommentElement.append(options);
            newCommentElement.append(optionsPopup);

            var dateElement = $('<p>').attr('id', 'datecom').text(formatDate(Date.now()));
            newCommentElement.append(dateElement);
            
            $(`.commentTextArea[data-postidc="${postId}"]`).append(newCommentElement);
            $(`#newComment[data-postidcom="${postId}"]`).val('');
            
            realcom = newCommentText;

            options.on('click', function(){
                const postid = $(this).closest('.add-comment').data('ccom');
                const time = $(this).closest('.commarea').find('#datecom').text().trim();
                const com = $(this).closest('.commarea');
                $('.options-popup-com').remove();
                
                let optionsButton = $('<div class="options-popup-com" style="display: none;">' +
                                        '<div class="options-popup-content-com">' +
                                            '<button class="edit-button-com">Edit</button>' +
                                            '<button class="delete-button-com">Delete</button>' +
                                            '<button class="cancel-com">Cancel</button>' +
                                        '</div>' +
                                    '</div>');
            
                com.append(optionsButton);
                optionsButton.toggle();
                
                $('.delete-button-com').on('click', function (event) {
                    event.preventDefault();
                    if (confirm('Are you sure you want to delete this comment?')) {
                        optionsButton.css('display', 'none');
                        $.ajax({
                            url: "/delcom",
                            method: "POST",
                            contentType: "application/json",
                            data:  JSON.stringify({ post: postid, user: comuser, comment: realcom, time: time}),
                            success: function (res) {
                                com.remove()
                            }
                        })
                    }
                });
            
                $(".edit-button-com").on("click", function (event) {
                    event.preventDefault();
                    optionsButton.css('display', 'none');
                    const comContentElement = $(this).closest('.commarea').find('.newcommenttext');
                    const originalcomContent = comContentElement.text().trim();
                    
                    const editTextArea = $('<textarea>').val(originalcomContent);
                    comContentElement.replaceWith(editTextArea);
                
                    const saveButton = $('<button>').text('Save');
                    saveButton.on('click', function () {
                        const editedcomContent = editTextArea.val().trim();
                        if (editedcomContent === '') {
                            alert('Please enter post content.');
                            return;
                        }
                        comContentElement.text(editedcomContent);
                        editTextArea.replaceWith(comContentElement);
                        saveButton.remove();
                        
                        $.ajax({
                            url: "/editcom",
                            method: "POST",
                            contentType: "application/json",
                            data:  JSON.stringify({ post: postid, user: comuser, oldc: originalcomContent, editc: editedcomContent, time: time }),
                            success: function (res) {
                                realcom = editedcomContent;
                            }
                        });
                
                    });
                
                    editTextArea.after(saveButton);
                });
            
                optionsButton.find('.cancel-com').on('click', function () {
                    optionsButton.css('display', 'none');
                });
            });            
        });
        

    $(".options-button-com").on("click", function () {
        const postid = $(this).closest('.add-comment').data('ccom');
        const user = $(this).closest('.commarea').find('.comid').data('ucom');
        const comment = $(this).closest('.commarea').find('.ccom').text().trim();    
        const time = $(this).closest('.commarea').find('#datecom').text().trim();
        const com = $(this).closest('.commarea');
        $('.options-popup-com').remove();
        
        let optionsButton = $('<div class="options-popup-com" style="display: none;">' +
                                 '<div class="options-popup-content-com">' +
                                     '<button class="edit-button-com">Edit</button>' +
                                     '<button class="delete-button-com">Delete</button>' +
                                     '<button class="cancel-com">Cancel</button>' +
                                 '</div>' +
                             '</div>');
    
        com.append(optionsButton);
        optionsButton.toggle();
    
        $('.delete-button-com').on('click', function (event) {
            event.preventDefault();
            if (confirm('Are you sure you want to delete this comment?')) {
                optionsButton.css('display', 'none');
                $.ajax({
                    url: "/delcom",
                    method: "POST",
                    contentType: "application/json",
                    data:  JSON.stringify({ post: postid, user: user, comment: comment, time: time}),
                    success: function (res) {
                        com.remove();
                    }
                })
            }
        });
    
        $(".edit-button-com").on("click", function (event) {
            event.preventDefault();
            optionsButton.css('display', 'none');
            const comContentElement = $(this).closest('.commarea').find(`.ccom`); 
            const originalcomContent = comContentElement.text().trim();
            
            const editTextArea = $('<textarea>').val(originalcomContent);
            comContentElement.replaceWith(editTextArea);
        
            const saveButton = $('<button>').text('Save');
            saveButton.on('click', function () {
                const editedcomContent = editTextArea.val().trim();
                if (editedcomContent === '') {
                    alert('Please enter post content.');
                    return;
                }
                comContentElement.text(editedcomContent);
                editTextArea.replaceWith(comContentElement);
                saveButton.remove();
                
                $.ajax({
                    url: "/editcom",
                    method: "POST",
                    contentType: "application/json",
                    data:  JSON.stringify({ post: postid, user: user, oldc: originalcomContent, editc: editedcomContent, time: time }),
                    success: function (res) {
                        $(".commentTextArea").css('display', 'block'); 
                    }
                });
        
            });
        
            editTextArea.after(saveButton);
        });

        optionsButton.find('.cancel-com').on('click', function () {
            optionsButton.css('display', 'none');
        });
    });
    
});
