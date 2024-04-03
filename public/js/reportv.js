$(document).ready(function () {
    const postid = $(this).closest('.profile-info').find('.postid').html();
    console.log(postid)
    $(".delete-button").on("click", function(){
        const postid = $(this).closest('.profile-info').find('.postid').html();

        $.ajax({
            url:"/delpost",
            method: "POST",
            contentType: "application/json",
            data:  JSON.stringify({ post: postid}),
            success: function (res) {
                location.reload();
            }
        })
    });

    $(".unreport-button").on("click", function(){
        const postid = $(this).closest('.profile-info').find('.postid').html();

        $.ajax({
            url:"/unrepost",
            method: "POST",
            contentType: "application/json",
            data:  JSON.stringify({ post: postid}),
            success: function (res) {
                location.reload();
            }
        })
    });
})