$.fn.fadeIn = function () {
  $(this)
    .css("opacity", 0)
    .slideDown()
    .animate({ opacity: 1 }, { queue: false });
};
$.fn.fadeOut = function () {
  $(this).css("opacity", 1).slideUp().animate({ opacity: 0 }, { queue: false });
};

const showError = (error) => {
  if (error.param === "notifications") return showEvent(error);
  const input = $(`#${error.param}:visible, #${error.param}-register:visible`);
  if (input.parent().hasClass("has-error")) return;
  input.parent().addClass("has-error");
  input.parent().children(".form-error").fadeOut();
  input
    .after(
      `<p class="form-error" style="display: none;">${error.msg}<button type="button" class="close" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button></p>`
    )
    .next()
    .fadeIn();
};

const showEvent = (event, type = "danger") => {
  const div = $("#notifications").children("div");
  if (event) {
    div
      .removeClass("alert-success")
      .addClass(`alert-${type}`)
      .children("span")
      .text(event.msg);
  } else {
    div
      .removeClass("alert-danger")
      .addClass("alert-success")
      .children("span")
      .text("Successfully signed in!");
  }
  div.fadeIn();
};

$(document).on("click", "#logout", function (e) {
  e.preventDefault();
  $.ajax({
    url: "/api/auth/logout",
    method: "post",
  })
    .done((data) => {
      showEvent(
        { msg: "Signed out successfully", param: "notifications" },
        "success"
      );
      setTimeout(() => {
        window.location.reload();
      }, 500);
    })
    .fail(({ responseJSON: { errors } }) => {
      errors.forEach(showError);
    });
});

let room;

const joinRoom = async (event, identity) => {
  const response = await fetch(`/token?identity=${identity}`);
  const jsonResponse = await response.json();
  const token = jsonResponse.token;

  const Video = Twilio.Video;

  const localTracks = await Video.createLocalTracks({
    audio: true,
    video: { width: 720 },
  });
  try {
    room = await Video.connect(token, {
      name: "telemedicineAppointment",
      tracks: localTracks,
    });
  } catch (error) {
    console.log(error);
  }
  const localMediaContainer = document.getElementById("local-media-container");
  localTracks.forEach((localTrack) => {
    localMediaContainer.appendChild(localTrack.attach());
  });

  room.participants.forEach(onParticipantConnected);

  room.on("participantConnected", onParticipantConnected);

  room.on("participantDisconnected", onParticipantDisconnected);

  toggleButtons();

  event.preventDefault();
};

const onParticipantDisconnected = (participant) => {
  const participantDiv = document.getElementById(participant.sid);
  participantDiv.parentNode.removeChild(participantDiv);
};

const onParticipantConnected = (participant) => {
  const participantDiv = document.createElement("div");
  participantDiv.id = participant.sid;

  const trackSubscribed = (track) => {
    participantDiv.appendChild(track.attach());
  };
  participant.on("trackSubscribed", trackSubscribed);

  participant.tracks.forEach((publication) => {
    if (publication.isSubscribed) {
      trackSubscribed(publication.track);
    }
  });

  document.body.appendChild(participantDiv);

  const trackUnsubscribed = (track) => {
    track.detach().forEach((element) => element.remove());
  };

  participant.on("trackUnsubscribed", trackUnsubscribed);
};

const onLeaveButtonClick = (event) => {
  room.localParticipant.tracks.forEach((publication) => {
    const track = publication.track;
    track.stop();
    const elements = track.detach();
    elements.forEach((element) => element.remove());
  });
  room.disconnect();

  toggleButtons();
};

const toggleButtons = () => {
  document.getElementById("leave-button").classList.toggle("hidden");
  document.getElementById("join-button").classList.toggle("hidden");
};