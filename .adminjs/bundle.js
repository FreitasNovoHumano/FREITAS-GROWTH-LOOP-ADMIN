(function (React, adminjs) {
  'use strict';

  function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

  var React__default = /*#__PURE__*/_interopDefault(React);

  const api = new adminjs.ApiClient();
  const metrics = [{
    key: "leadsGenerated",
    title: "Leads gerados",
    accent: "#6D28D9"
  }, {
    key: "leadsInvited",
    title: "Leads convidados",
    accent: "#2563EB"
  }, {
    key: "leadsAccepted",
    title: "Convites aceitos",
    accent: "#0F766E"
  }];
  function GrowthDashboard() {
    const [data, setData] = React.useState(null);
    const [error, setError] = React.useState("");
    React.useEffect(() => {
      let active = true;
      api.getDashboard().then(response => {
        if (active) setData(response.data);
      }).catch(() => {
        if (active) setError("Não foi possível carregar os indicadores.");
      });
      return () => {
        active = false;
      };
    }, []);
    return /*#__PURE__*/React__default.default.createElement("main", {
      className: "growth-dashboard"
    }, /*#__PURE__*/React__default.default.createElement("style", null, `
        .growth-dashboard {
          padding: 32px;
          min-height: 100%;
          background: #f7f7fb;
        }
        .growth-dashboard__header {
          margin-bottom: 24px;
        }
        .growth-dashboard__header h1 {
          margin: 0 0 8px;
          color: #17151f;
          font-size: 30px;
          line-height: 1.2;
        }
        .growth-dashboard__header p {
          margin: 0;
          color: #716d7d;
          font-size: 14px;
        }
        .growth-dashboard__grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
        }
        .growth-dashboard__card {
          min-height: 160px;
          padding: 24px;
          border: 1px solid #e8e5ed;
          border-top: 4px solid var(--card-accent);
          border-radius: 14px;
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(40, 31, 61, 0.06);
        }
        .growth-dashboard__card h3 {
          margin: 0 0 24px;
          color: #716d7d;
          font-size: 14px;
          font-weight: 600;
        }
        .growth-dashboard__card h2 {
          margin: 0;
          color: #17151f;
          font-size: 42px;
          line-height: 1;
        }
        .growth-dashboard__error {
          padding: 16px;
          border-radius: 10px;
          background: #fff1f0;
          color: #a61b1b;
        }
        @media (max-width: 900px) {
          .growth-dashboard__grid {
            grid-template-columns: 1fr;
          }
        }
      `), /*#__PURE__*/React__default.default.createElement("header", {
      className: "growth-dashboard__header"
    }, /*#__PURE__*/React__default.default.createElement("h1", null, "Vis\xE3o geral de leads"), /*#__PURE__*/React__default.default.createElement("p", null, "Acompanhe a gera\xE7\xE3o e a convers\xE3o dos convites das campanhas.")), error ? /*#__PURE__*/React__default.default.createElement("p", {
      className: "growth-dashboard__error"
    }, error) : /*#__PURE__*/React__default.default.createElement("section", {
      className: "growth-dashboard__grid",
      "aria-label": "Indicadores de leads"
    }, metrics.map(metric => /*#__PURE__*/React__default.default.createElement("article", {
      className: "growth-dashboard__card",
      key: metric.key,
      style: {
        "--card-accent": metric.accent
      }
    }, /*#__PURE__*/React__default.default.createElement("h3", null, metric.title), /*#__PURE__*/React__default.default.createElement("h2", null, data ? data[metric.key].toLocaleString("pt-BR") : "—")))));
  }

  AdminJS.UserComponents = {};
  AdminJS.UserComponents.GrowthDashboard = GrowthDashboard;

})(React, AdminJS);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9zcmMvYWRtaW4vZGFzaGJvYXJkL2Rhc2hib2FyZC5jb21wb25lbnQuanN4IiwiZW50cnkuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IEFwaUNsaWVudCB9IGZyb20gXCJhZG1pbmpzXCI7XG5cbmNvbnN0IGFwaSA9IG5ldyBBcGlDbGllbnQoKTtcblxuY29uc3QgbWV0cmljcyA9IFtcbiAgeyBrZXk6IFwibGVhZHNHZW5lcmF0ZWRcIiwgdGl0bGU6IFwiTGVhZHMgZ2VyYWRvc1wiLCBhY2NlbnQ6IFwiIzZEMjhEOVwiIH0sXG4gIHsga2V5OiBcImxlYWRzSW52aXRlZFwiLCB0aXRsZTogXCJMZWFkcyBjb252aWRhZG9zXCIsIGFjY2VudDogXCIjMjU2M0VCXCIgfSxcbiAgeyBrZXk6IFwibGVhZHNBY2NlcHRlZFwiLCB0aXRsZTogXCJDb252aXRlcyBhY2VpdG9zXCIsIGFjY2VudDogXCIjMEY3NjZFXCIgfSxcbl07XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEdyb3d0aERhc2hib2FyZCgpIHtcbiAgY29uc3QgW2RhdGEsIHNldERhdGFdID0gdXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IFtlcnJvciwgc2V0RXJyb3JdID0gdXNlU3RhdGUoXCJcIik7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsZXQgYWN0aXZlID0gdHJ1ZTtcblxuICAgIGFwaS5nZXREYXNoYm9hcmQoKVxuICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgIGlmIChhY3RpdmUpIHNldERhdGEocmVzcG9uc2UuZGF0YSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKCgpID0+IHtcbiAgICAgICAgaWYgKGFjdGl2ZSkgc2V0RXJyb3IoXCJOw6NvIGZvaSBwb3Nzw612ZWwgY2FycmVnYXIgb3MgaW5kaWNhZG9yZXMuXCIpO1xuICAgICAgfSk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgYWN0aXZlID0gZmFsc2U7XG4gICAgfTtcbiAgfSwgW10pO1xuXG4gIHJldHVybiAoXG4gICAgPG1haW4gY2xhc3NOYW1lPVwiZ3Jvd3RoLWRhc2hib2FyZFwiPlxuICAgICAgPHN0eWxlPntgXG4gICAgICAgIC5ncm93dGgtZGFzaGJvYXJkIHtcbiAgICAgICAgICBwYWRkaW5nOiAzMnB4O1xuICAgICAgICAgIG1pbi1oZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgYmFja2dyb3VuZDogI2Y3ZjdmYjtcbiAgICAgICAgfVxuICAgICAgICAuZ3Jvd3RoLWRhc2hib2FyZF9faGVhZGVyIHtcbiAgICAgICAgICBtYXJnaW4tYm90dG9tOiAyNHB4O1xuICAgICAgICB9XG4gICAgICAgIC5ncm93dGgtZGFzaGJvYXJkX19oZWFkZXIgaDEge1xuICAgICAgICAgIG1hcmdpbjogMCAwIDhweDtcbiAgICAgICAgICBjb2xvcjogIzE3MTUxZjtcbiAgICAgICAgICBmb250LXNpemU6IDMwcHg7XG4gICAgICAgICAgbGluZS1oZWlnaHQ6IDEuMjtcbiAgICAgICAgfVxuICAgICAgICAuZ3Jvd3RoLWRhc2hib2FyZF9faGVhZGVyIHAge1xuICAgICAgICAgIG1hcmdpbjogMDtcbiAgICAgICAgICBjb2xvcjogIzcxNmQ3ZDtcbiAgICAgICAgICBmb250LXNpemU6IDE0cHg7XG4gICAgICAgIH1cbiAgICAgICAgLmdyb3d0aC1kYXNoYm9hcmRfX2dyaWQge1xuICAgICAgICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgICAgICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiByZXBlYXQoMywgbWlubWF4KDAsIDFmcikpO1xuICAgICAgICAgIGdhcDogMjRweDtcbiAgICAgICAgfVxuICAgICAgICAuZ3Jvd3RoLWRhc2hib2FyZF9fY2FyZCB7XG4gICAgICAgICAgbWluLWhlaWdodDogMTYwcHg7XG4gICAgICAgICAgcGFkZGluZzogMjRweDtcbiAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjZThlNWVkO1xuICAgICAgICAgIGJvcmRlci10b3A6IDRweCBzb2xpZCB2YXIoLS1jYXJkLWFjY2VudCk7XG4gICAgICAgICAgYm9yZGVyLXJhZGl1czogMTRweDtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAjZmZmZmZmO1xuICAgICAgICAgIGJveC1zaGFkb3c6IDAgMTBweCAzMHB4IHJnYmEoNDAsIDMxLCA2MSwgMC4wNik7XG4gICAgICAgIH1cbiAgICAgICAgLmdyb3d0aC1kYXNoYm9hcmRfX2NhcmQgaDMge1xuICAgICAgICAgIG1hcmdpbjogMCAwIDI0cHg7XG4gICAgICAgICAgY29sb3I6ICM3MTZkN2Q7XG4gICAgICAgICAgZm9udC1zaXplOiAxNHB4O1xuICAgICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICAgIH1cbiAgICAgICAgLmdyb3d0aC1kYXNoYm9hcmRfX2NhcmQgaDIge1xuICAgICAgICAgIG1hcmdpbjogMDtcbiAgICAgICAgICBjb2xvcjogIzE3MTUxZjtcbiAgICAgICAgICBmb250LXNpemU6IDQycHg7XG4gICAgICAgICAgbGluZS1oZWlnaHQ6IDE7XG4gICAgICAgIH1cbiAgICAgICAgLmdyb3d0aC1kYXNoYm9hcmRfX2Vycm9yIHtcbiAgICAgICAgICBwYWRkaW5nOiAxNnB4O1xuICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gICAgICAgICAgYmFja2dyb3VuZDogI2ZmZjFmMDtcbiAgICAgICAgICBjb2xvcjogI2E2MWIxYjtcbiAgICAgICAgfVxuICAgICAgICBAbWVkaWEgKG1heC13aWR0aDogOTAwcHgpIHtcbiAgICAgICAgICAuZ3Jvd3RoLWRhc2hib2FyZF9fZ3JpZCB7XG4gICAgICAgICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDFmcjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIGB9PC9zdHlsZT5cblxuICAgICAgPGhlYWRlciBjbGFzc05hbWU9XCJncm93dGgtZGFzaGJvYXJkX19oZWFkZXJcIj5cbiAgICAgICAgPGgxPlZpc8OjbyBnZXJhbCBkZSBsZWFkczwvaDE+XG4gICAgICAgIDxwPkFjb21wYW5oZSBhIGdlcmHDp8OjbyBlIGEgY29udmVyc8OjbyBkb3MgY29udml0ZXMgZGFzIGNhbXBhbmhhcy48L3A+XG4gICAgICA8L2hlYWRlcj5cblxuICAgICAge2Vycm9yID8gKFxuICAgICAgICA8cCBjbGFzc05hbWU9XCJncm93dGgtZGFzaGJvYXJkX19lcnJvclwiPntlcnJvcn08L3A+XG4gICAgICApIDogKFxuICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJncm93dGgtZGFzaGJvYXJkX19ncmlkXCIgYXJpYS1sYWJlbD1cIkluZGljYWRvcmVzIGRlIGxlYWRzXCI+XG4gICAgICAgICAge21ldHJpY3MubWFwKChtZXRyaWMpID0+IChcbiAgICAgICAgICAgIDxhcnRpY2xlXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImdyb3d0aC1kYXNoYm9hcmRfX2NhcmRcIlxuICAgICAgICAgICAgICBrZXk9e21ldHJpYy5rZXl9XG4gICAgICAgICAgICAgIHN0eWxlPXt7IFwiLS1jYXJkLWFjY2VudFwiOiBtZXRyaWMuYWNjZW50IH19XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxoMz57bWV0cmljLnRpdGxlfTwvaDM+XG4gICAgICAgICAgICAgIDxoMj57ZGF0YSA/IGRhdGFbbWV0cmljLmtleV0udG9Mb2NhbGVTdHJpbmcoXCJwdC1CUlwiKSA6IFwi4oCUXCJ9PC9oMj5cbiAgICAgICAgICAgIDwvYXJ0aWNsZT5cbiAgICAgICAgICApKX1cbiAgICAgICAgPC9zZWN0aW9uPlxuICAgICAgKX1cbiAgICA8L21haW4+XG4gICk7XG59XG4iLCJBZG1pbkpTLlVzZXJDb21wb25lbnRzID0ge31cbmltcG9ydCBHcm93dGhEYXNoYm9hcmQgZnJvbSAnLi4vc3JjL2FkbWluL2Rhc2hib2FyZC9kYXNoYm9hcmQuY29tcG9uZW50J1xuQWRtaW5KUy5Vc2VyQ29tcG9uZW50cy5Hcm93dGhEYXNoYm9hcmQgPSBHcm93dGhEYXNoYm9hcmQiXSwibmFtZXMiOlsiYXBpIiwiQXBpQ2xpZW50IiwibWV0cmljcyIsImtleSIsInRpdGxlIiwiYWNjZW50IiwiR3Jvd3RoRGFzaGJvYXJkIiwiZGF0YSIsInNldERhdGEiLCJ1c2VTdGF0ZSIsImVycm9yIiwic2V0RXJyb3IiLCJ1c2VFZmZlY3QiLCJhY3RpdmUiLCJnZXREYXNoYm9hcmQiLCJ0aGVuIiwicmVzcG9uc2UiLCJjYXRjaCIsIlJlYWN0IiwiY3JlYXRlRWxlbWVudCIsImNsYXNzTmFtZSIsIm1hcCIsIm1ldHJpYyIsInN0eWxlIiwidG9Mb2NhbGVTdHJpbmciLCJBZG1pbkpTIiwiVXNlckNvbXBvbmVudHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7RUFHQSxNQUFNQSxHQUFHLEdBQUcsSUFBSUMsaUJBQVMsRUFBRTtFQUUzQixNQUFNQyxPQUFPLEdBQUcsQ0FDZDtFQUFFQyxFQUFBQSxHQUFHLEVBQUUsZ0JBQWdCO0VBQUVDLEVBQUFBLEtBQUssRUFBRSxlQUFlO0VBQUVDLEVBQUFBLE1BQU0sRUFBRTtFQUFVLENBQUMsRUFDcEU7RUFBRUYsRUFBQUEsR0FBRyxFQUFFLGNBQWM7RUFBRUMsRUFBQUEsS0FBSyxFQUFFLGtCQUFrQjtFQUFFQyxFQUFBQSxNQUFNLEVBQUU7RUFBVSxDQUFDLEVBQ3JFO0VBQUVGLEVBQUFBLEdBQUcsRUFBRSxlQUFlO0VBQUVDLEVBQUFBLEtBQUssRUFBRSxrQkFBa0I7RUFBRUMsRUFBQUEsTUFBTSxFQUFFO0VBQVUsQ0FBQyxDQUN2RTtFQUVjLFNBQVNDLGVBQWVBLEdBQUc7SUFDeEMsTUFBTSxDQUFDQyxJQUFJLEVBQUVDLE9BQU8sQ0FBQyxHQUFHQyxjQUFRLENBQUMsSUFBSSxDQUFDO0lBQ3RDLE1BQU0sQ0FBQ0MsS0FBSyxFQUFFQyxRQUFRLENBQUMsR0FBR0YsY0FBUSxDQUFDLEVBQUUsQ0FBQztFQUV0Q0csRUFBQUEsZUFBUyxDQUFDLE1BQU07TUFDZCxJQUFJQyxNQUFNLEdBQUcs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
