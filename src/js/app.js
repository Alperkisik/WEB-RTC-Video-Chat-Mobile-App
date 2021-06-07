import $ from "dom7";
import Framework7, { getDevice } from "framework7/bundle";

// Import F7 Styles
import "framework7/framework7-bundle.css";

// Import Icons and App Custom Styles
import "../css/icons.css";
import "../css/app.css";
// Import Cordova APIs
import cordovaApp from "./cordova-app.js";

// Import Routes
import routes from "./routes.js";

// Import main app component
import App from "../app.f7.html";

var device = getDevice();
var app = new Framework7({
    name: "Video Chat app", // App name
    theme: "auto", // Automatic theme detection
    el: "#app", // App root element
    component: App, // App main component
    id: "io.framework7.myapp", // App bundle ID
    // App routes
    routes: routes,

    // Input settings
    input: {
        scrollIntoViewOnFocus: device.cordova && !device.electron,
        scrollIntoViewCentered: device.cordova && !device.electron,
    },
    // Cordova Statusbar settings
    statusbar: {
        iosOverlaysWebView: true,
        androidOverlaysWebView: false,
    },
    on: {
        init: function () {
            var f7 = this;
            if (f7.device.cordova) {
                // Init cordova APIs (see cordova-app.js)
                cordovaApp.init(f7);
            }
        },
    },
});

$(document).on("page:init", '.page[data-name="chatroom"]', function (e) {
    console.log(device);
    if (device.cordova == true) {
        var permissions = cordova.plugins.permissions;
        console.log(permissions);
        var list = [permissions.CAMERA, permissions.GET_ACCOUNTS, permissions.RECORD_AUDIO, permissions.WRITE_EXTERNAL_STORAGE, permissions.INTERNET, permissions.MODIFY_AUDIO_SETTINGS];

        permissions.hasPermission(list, success, error);
    }
    function error() {
        console.warn("Camera or Accounts permission is not turned on");
    }

    function success(status) {
        if (!status.hasPermission) {
            permissions.requestPermissions(
                list,
                function (status) {
                    if (!status.hasPermission) error();
                },
                error
            );
        }
    }

    var peer;
    var localCam = $("#local-cam")[0];
    var remoteCam = $("#remote-cam")[0];
    $("#open-cam").click(async function () {
        //$("#close-call").prop("disabled", true);
        peer = new Peer({
            config: { iceServers: [{ url: "stun:stun.l.google.com:19302" }] } /* Sample servers, please use appropriate ones */,
        });
        console.log(peer);

        peer.on("open", function (id) {
            console.log("My peer ID is: " + id);
            $("#local-id").html(id);
        });

        peer.on("connection", function (conn) {
            conn.on("data", function (data) {
                // Will print 'hi!'

                console.log(data);
                console.log(conn);
            });
        });

        peer.on("call", async function (call) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            call.answer(stream); // Answer the call with an A/V stream.
            call.on("stream", function (remoteStream) {
                // Show stream in some video/canvas element.
                remoteCam.srcObject = remoteStream;
                remoteCam.play();
            });
        });

        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log(mediaStream);
        localCam.srcObject = mediaStream;
        localCam.play();
    });

    $("#connect").click(async function () {
        let id = $("#call-id").val();
        peer = new Peer({
            config: { iceServers: [{ url: "stun:stun.l.google.com:19302" }] } /* Sample servers, please use appropriate ones */,
        });
        peer.on("open", function (id) {
            console.log("My peer ID is: " + id);
            $("#local-id").html(id);
        });

        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localCam.srcObject = mediaStream;
        localCam.play();

        var conn = peer.connect(id);

        conn.on("open", function () {
            // here you have conn.id
            conn.send("hi!");
        });

        console.log(conn);

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        var call = peer.call(id, stream);
        call.on("stream", function (remoteStream) {
            console.log("bağlantı kuruldu");
            remoteCam.srcObject = remoteStream;
            remoteCam.play();
        });
        //connection(id);
    });

    $("#close-call").click(function () {
        console.log("asdasd");
        peer.destroy();
        console.log(localCam);
        $("#local-cam").remove();
        $("#remote-cam").remove();
        let localvideoHtml = "<video class='cam margin-bottom' id='local-cam'></video>";
        let remotevideoHtml = "<video class='cam' id='remote-cam'></video>";
        $(".cam-section").html("");
        $(".cam-section").html(localvideoHtml + remotevideoHtml);
        localCam = $("#local-cam")[0];
        remoteCam = $("#remote-cam")[0];
        //localCam.srcObject = "";
        //remoteCam.srcObject = "";
    });

    function connection(id) {
        var conn = peer.connect(id);
        // on open will be launch when you successfully connect to PeerServer
        conn.on("open", function () {
            // here you have conn.id
            conn.send("hi!");
        });
    }

    function call(id) {
        var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        getUserMedia(
            { video: true, audio: true },
            function (stream) {
                var call = peer.call("another-peers-id", stream);
                call.on("stream", function (remoteStream) {
                    // Show stream in some video/canvas element.
                });
            },
            function (err) {
                console.log("Failed to get local stream", err);
            }
        );
    }

    function answer() {
        var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        peer.on("call", function (call) {
            getUserMedia(
                { video: true, audio: true },
                function (stream) {
                    call.answer(stream); // Answer the call with an A/V stream.
                    call.on("stream", function (remoteStream) {
                        // Show stream in some video/canvas element.
                    });
                },
                function (err) {
                    console.log("Failed to get local stream", err);
                }
            );
        });
    }

    function toggleMic(localStream) {
        toggleBtn($("#mic-btn")); // toggle button colors
        $("#mic-icon").toggleClass("fa-microphone").toggleClass("fa-microphone-slash"); // toggle the mic icon
        if ($("#mic-icon").hasClass("fa-microphone")) {
            localStream.enableAudio(); // enable the local mic
            toggleVisibility("#mute-overlay", false); // hide the muted mic icon
        } else {
            localStream.disableAudio(); // mute the local mic
            toggleVisibility("#mute-overlay", true); // show the muted mic icon
        }
    }

    function toggleVideo(localStream) {
        toggleBtn($("#video-btn")); // toggle button colors
        $("#video-icon").toggleClass("fa-video").toggleClass("fa-video-slash"); // toggle the video icon
        if ($("#video-icon").hasClass("fa-video")) {
            localStream.enableVideo(); // enable the local video
            toggleVisibility("#no-local-video", false); // hide the user icon when video is enabled
        } else {
            localStream.disableVideo(); // disable the local video
            toggleVisibility("#no-local-video", true); // show the user icon when video is disabled
        }
    }
});
