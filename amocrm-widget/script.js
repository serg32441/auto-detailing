/**
 * amoCRM widget: BTI Plan Comparison.
 *
 * The widget is a thin shell around a hosted web tool (the `/bti` page of your
 * deployed app). All heavy logic — the cheap pixel pre-filter and the OpenRouter
 * AI comparison — lives in that app and its backend, so the widget only needs to
 * embed it and pass the configured URL + access token.
 *
 * Two entry points:
 *   1. Widget settings page  -> the tool is embedded inline (guaranteed to work).
 *   2. Lead / contact card   -> a button opens the tool in a modal overlay.
 */
define(["jquery"], function ($) {
  var CustomWidget = function () {
    var self = this;

    /** Build the URL of the hosted comparison tool from widget settings. */
    function toolUrl() {
      var s = self.get_settings ? self.get_settings() : {};
      var base = String(s.app_url || "").replace(/\/+$/, "");
      if (!base) return "";
      var query = "api=" + encodeURIComponent(base);
      if (s.token) query += "&token=" + encodeURIComponent(s.token);
      // The app uses a HashRouter, so the route lives after `#`.
      return base + "/?" + query + "#/bti";
    }

    function i18n(key) {
      try {
        return self.i18n("widget")[key];
      } catch (e) {
        return key;
      }
    }

    /** Self-contained modal overlay with an iframe (no amo internals needed). */
    function openModal() {
      var url = toolUrl();
      if (!url) {
        alert(i18n("settings") ? "Укажите адрес приложения в настройках виджета." : "Set the application URL in widget settings.");
        return;
      }
      $("#bti-compare-overlay").remove();
      var $overlay = $(
        '<div id="bti-compare-overlay" style="position:fixed;inset:0;z-index:100000;' +
          'background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;">' +
          '<div style="position:relative;width:min(960px,94vw);height:min(720px,90vh);' +
          'background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35);">' +
          '<button id="bti-compare-close" style="position:absolute;top:8px;right:10px;z-index:2;' +
          'border:none;background:rgba(0,0,0,.06);border-radius:8px;width:32px;height:32px;cursor:pointer;' +
          'font-size:18px;line-height:1;">×</button>' +
          '<iframe src="' + url + '" style="border:0;width:100%;height:100%;" ' +
          'allow="clipboard-read; clipboard-write"></iframe>' +
          "</div></div>",
      );
      $overlay.on("click", function (e) {
        if (e.target === $overlay[0]) $overlay.remove();
      });
      $overlay.find("#bti-compare-close").on("click", function () {
        $overlay.remove();
      });
      $("body").append($overlay);
    }

    /** Build the "open" button used on the card. */
    function buildButton() {
      return $(
        '<button type="button" class="button-input js-bti-open" ' +
          'style="width:100%;margin-top:8px;padding:8px 12px;border-radius:6px;' +
          'border:1px solid #2563eb;background:#2563eb;color:#fff;cursor:pointer;">' +
          i18n("open_button") +
          "</button>",
      ).on("click", openModal);
    }

    this.callbacks = {
      /** Called when the widget block is rendered on a card. */
      render: function () {
        try {
          var area = self.system().area;
          // On lead/contact cards amo renders a block for the widget; append the
          // button into it. Selector falls back gracefully across amo themes.
          if (area === "lcard" || area === "ccard") {
            var $block = $(".js-widget-" + self.params.widget_code);
            if (!$block.length) {
              $block = $('[data-id="' + self.params.id + '"]');
            }
            if ($block.length && !$block.find(".js-bti-open").length) {
              $block.append(buildButton());
            }
          }
        } catch (e) {
          /* non-fatal: settings-page embed still works */
        }
        return true;
      },

      init: function () {
        return true;
      },

      bind_actions: function () {
        return true;
      },

      /** Settings page: embed the full tool inline + show the open button. */
      settings: function ($modal) {
        var url = toolUrl();
        var $body = $modal && $modal.length ? $modal : $("body");
        $body.find(".bti-settings-embed").remove();
        var $embed = $(
          '<div class="bti-settings-embed" style="margin-top:12px;">' +
            '<p style="margin:0 0 8px;color:#64748b;font-size:13px;">' +
            i18n("open_hint") +
            "</p>" +
            (url
              ? '<iframe src="' + url + '" style="border:1px solid #e2e8f0;' +
                'border-radius:10px;width:100%;height:560px;"></iframe>'
              : '<div style="padding:16px;border:1px dashed #cbd5e1;border-radius:10px;' +
                'color:#64748b;">Укажите «Адрес приложения» и сохраните настройки.</div>') +
            "</div>",
        );
        $body.append($embed);
        return true;
      },

      onSave: function () {
        return true;
      },

      destroy: function () {
        $("#bti-compare-overlay").remove();
      },

      leads: {
        selected: function () {},
      },
      contacts: {
        selected: function () {},
      },
    };

    return this;
  };

  return CustomWidget;
});
