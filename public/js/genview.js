function like(x){
    let query = new URLSearchParams(window.location.search);
    let loguser = query.get('loguser');
    let postid = x.getAttribute("data-like");
    let likes = parseInt(document.getElementById(`like_${postid}`).textContent);
    let dislikebtn = document.querySelector(`[data-dislike="${postid}"]`);
    let dislikes = parseInt(document.getElementById(`dislike_${postid}`).textContent);
    let status;

    if(x.classList.contains("fas")){
        x.classList.remove("fas");
        x.classList.add("far");
        likes--;
        status = "unliked";
    } else {
        x.classList.remove("far");
        x.classList.add("fas");
        likes++;
        status = "liked";
        if(dislikebtn.classList.contains("fas")){
            dislikebtn.classList.remove("fas");
            dislikebtn.classList.add("far");
            dislikes--;
        }
    }

    document.getElementById(`like_${postid}`).textContent = likes;
    document.getElementById(`dislike_${postid}`).textContent = dislikes;

    return fetch('/like', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ postid, loguser, likes, dislikes, status })
    });
}

function dislike(y){
    let query = new URLSearchParams(window.location.search);
    let loguser = query.get('loguser');
    let postid = y.getAttribute("data-dislike");
    let likes = parseInt(document.getElementById(`like_${postid}`).textContent);
    let likebtn = document.querySelector(`[data-like="${postid}"]`);
    let dislikes = parseInt(document.getElementById(`dislike_${postid}`).textContent);
    let status;

    if(y.classList.contains("fas")){
        y.classList.remove("fas");
        y.classList.add("far");
        dislikes--;
        status = "undisliked";
    } else {
        y.classList.remove("far");
        y.classList.add("fas");
        dislikes++;
        status = "disliked";
        if(likebtn.classList.contains("fas")){
            likebtn.classList.remove("fas");
            likebtn.classList.add("far");
            likes--;
        }
    }

    document.getElementById(`like_${postid}`).textContent = likes;
    document.getElementById(`dislike_${postid}`).textContent = dislikes;

    return fetch('/like', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ postid, loguser, likes, dislikes, status })
    });
}

$(document).ready(function () {
    const query = new URLSearchParams(window.location.search);
    const logu = query.get('loguser');

    $.ajax({
        url: "/likecheck",
        method: "GET",
        contentType: "application/json",
        data: { loguser: logu},
        success: function (res) {
            res.likedPosts.forEach(likedPost => {
                $(`#like[data-like="${likedPost.post}"]`).toggleClass("fas");
            });
            res.dislikedPosts.forEach(dislikedPost => {
                $(`#dislike[data-dislike="${dislikedPost.post}"]`).toggleClass("fas");
            });
        }
    });
    

    //create post
    $("#createPostButton").on("click", function (){
        document.getElementById("postPopup").style.display = "block";
    })

    //view post
    // function openViewPopup(content) {
    //     const popupContent = document.getElementById('postPopupContent');
    //     popupContent.innerHTML = content;
    //     document.getElementById("postPopupView").style.display = "block";
    // }

    
    $(".close").on("click", function(){
        $("textarea").val("");
        $("select").val("");
        $("#fileInput").val("");
        document.getElementById("postPopup").style.display = "none";
    }) 

    
    // document.querySelectorAll('.caption').forEach(caption => {
    //     caption.addEventListener('click', () => {
    //         const postContent = caption.closest('.post').innerHTML;
    //         openViewPopup(postContent);
    //     });
    // });
    
    //modify post
   $(".options-button").on("click", function () {
    const query = new URLSearchParams(window.location.search);
    const loguser = query.get('loguser');
    const postid = $(this).closest('.profile-info').find('.postid').html().trim();
    const user = $(this).closest('.profile-info').find('.userid').html().trim();
    const post = $(this).closest('.profile-info');
    let stattus;
    $('.options-popup').remove();
    
    let optionsButton;
    if (user === loguser) {
        optionsButton = $('<div class="options-popup" style="display: none;">' +
                             '<div class="options-popup-content">' +
                                 '<button class="edit-button">Edit</button>' +
                                 '<button class="delete-button">Delete</button>' +
                                 '<button class="cancel">Cancel</button>' +
                             '</div>' +
                         '</div>');
    } else {
        optionsButton = $('<div class="options-popup" style="display: none;">' +
                             '<div class="options-popup-content">' +
                                 '<button class="report-button">Report</button>' +
                                 '<button class="cancel">Cancel</button>' +
                             '</div>' +
                         '</div>');
    }

    post.append(optionsButton);
    optionsButton.toggle();

    optionsButton.find('.delete-button').on('click', function () {
        if (confirm('Are you sure you want to delete this post?')) {
            stattus = "delete";
            optionsButton.css('display', 'none');
            $.ajax({
                url: "/modpost",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({ loguser: loguser, post: postid, user: user, status: stattus }),
                success: function (res) {
                    location.reload();
                }
            });
        }
    });

    optionsButton.find('.report-button').on('click', function () {
        stattus = "report";
        optionsButton.css('display', 'none');
        $.ajax({
            url: "/modpost",
            method: "POST",
            contentType: "application/json",
            data:  JSON.stringify({ loguser: loguser, post: postid, user: user, status: stattus}),
            success: function (res) {
                location.reload();
            }
        })
    });

    $(".edit-button").on("click", function (event) {
        event.preventDefault();
        optionsButton.css('display', 'none');
        const postContentElement = $(this).closest('.post').find(`#captionn[data-postidcap="${postid}"]`); 
        const originalPostContent = postContentElement.text().trim();
        
        const editTextArea = $('<textarea>').val(originalPostContent);
        postContentElement.replaceWith(editTextArea);
    
        const saveButton = $('<button>').text('Save');
        saveButton.on('click', function () {
            const editedPostContent = editTextArea.val().trim();
            if (editedPostContent === '') {
                alert('Please enter post content.');
                return;
            }
            postContentElement.text(editedPostContent);
            editTextArea.replaceWith(postContentElement);
            saveButton.remove();
            
            $.ajax({
                url: "/editpost",
                method: "POST",
                contentType: "application/json",
                data:  JSON.stringify({ post: postid, editp: editedPostContent }),
                success: function (res) {
                 
                }
            });
    
        });
    
        editTextArea.after(saveButton);
    });
    
    optionsButton.find('.cancel').on('click', function () {
        optionsButton.css('display', 'none');
    });

    });
    
    $(".postprev").on("click", function(){
        const clickedp = $(this).data("postprev");
        const postPreview = $(`.p_${clickedp}`);
        const postContent = postPreview.html();

        const popupContent = document.getElementById('postPopupContent');
        popupContent.innerHTML = postContent;
        document.getElementById("postPopupView").style.display = "block";
        
        $(".showcom").on("click", function(){
            const postId =  $(this).data("postid");
            const commentTextArea = $(`.commentTextArea[data-postidc="${postId}"]`);
            if (commentTextArea.css('display') === 'none') {
                $(".commentTextArea").css('display', 'none'); 
                commentTextArea.css('display', 'block');
                $(`#newComment[data-postidcom="${postId}"]`).val(""); 
            } else {
                commentTextArea.css('display', 'none'); 
                $(`#newComment[data-postidcom="${postId}"]`).val(""); 
            }
        });
    });

    $("#postPopupView .close").on("click", function(event){
        document.getElementById("postPopupView").style.display = "none";
    });

    
});