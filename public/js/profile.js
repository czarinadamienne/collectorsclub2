$(document).ready(function () {
    $("#del").on("click", function (event) {
        event.preventDefault();
        var user = $("#username").text();
        if (window.confirm("Are you sure you want to delete your account?")) {
            $.ajax({
                url: "/del",
                method: "DELETE",
                contentType: "application/json",
                data: JSON.stringify({ user: user }),
                success: function (res) {
                    alert("Your account has been deleted.");
                    window.location.href = "/";
                },
                error: function (err) {
                    console.log(err);
                    alert("Failed to delete account.");
                }
            });
        }
    });

    $("#edit").on("click", function (event) {
        event.preventDefault();
        const emailSpan = $("#email");
        const user = $("#username").text();
        console.log(emailSpan.text());
        console.log(user);

        emailSpan.html(`<input type="text" value="${emailSpan.text()}" style="width: 300px;" required>`);

        const editButton = $(".edit-button");
        editButton.text("Save");
        editButton.off("click").on("click", function () {
            const newEmail = emailSpan.find("input").val();

            emailSpan.html(newEmail);

            editButton.text("Edit");
            editButton.off("click").on("click", function () {
                emailSpan.html(`<input type="text" value="${emailSpan.text()}" style="width: 300px;" required>`);
                editButton.text("Save");
            });

            $.ajax({
                url: "/editprof",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({ bio: newEmail, user: user }),
                success: function (res) {
                    location.reload();
                }
            });
        });
    });

    $(".pfp-button").on("click", function(){
        document.getElementById('edit').style.display = 'none';
        document.getElementById('del').style.display = 'none';
        document.getElementById('pfp').style.display = 'none';
        document.getElementById('pfpForm').style.display = 'block';

        $("#cancel").on("click", function(){
            document.getElementById('pfpForm').reset();
            document.getElementById('edit').style.display = 'inline-block';
            document.getElementById('del').style.display = 'inline-block';
            document.getElementById('pfp').style.display = 'inline-block';
            document.getElementById('pfpForm').style.display = 'none';
        })
    });

    const query = new URLSearchParams(window.location.search);
    const loguser = query.get('loguser');
    const userid = query.get('userid');
   
    $.ajax({
        url: "/followcheck",
        method: "GET",
        contentType: "application/json",
        data: { loguser: loguser, userid: userid },
        success: function (res) {
            if (res.isFollowing) {
                $(".follow").text("Unfollow");
            } else {
                $(".follow").text("Follow");
            }
        }
    });

    $(".follow").on("click", function () {
        var sstatus;
        if ($(this).text() === "Follow") {
            $(this).text("Unfollow");
            sstatus = "follow"; 
        } else {
            $(this).text("Follow");
            sstatus = "unfollow";
        }
        $.ajax({
            url: "/followuser",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ loguser: loguser, userid: userid, sstatus : sstatus }),
            success: function(res){
                
            }
        });
    });
});