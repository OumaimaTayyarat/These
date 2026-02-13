import { createMachine } from "xstate"

const AppMachine = createMachine(
  {
    id: "App",
    initial: "IDLE",
    states: {
      IDLE: {
        on: {
          load: {
            target: "LOADING",
            internal: false,
          },
        },
      },
      LOADING: {
        on: {
          error: {
            target: "LOAD_ERROR",
            internal: false,
          },
          complete: {
            target: "INIT",
            internal: false,
          },
        },
      },
      LOAD_ERROR: {
        on: {
          reload: {
            target: "LOADING",
            internal: false,
          },
        },
      },
      INIT: {
        on: {
          begin: {
            target: "TITLE_SCREEN",
            internal: false,
          },
        },
      },
      TITLE_SCREEN: {
        on: {
          next: {
            target: "INSTRUCTIONS_Avatar",
            internal: false,
          },
          skip: {
            target: "SETUP_Application",
            internal: false,
          },
          credits: {
            target: "CREDITS",
            internal: false,
          },
          endless: {
            target: "SETUP_ENDLESS",
            internal: false,
          },
          debug: {
            target: "SCENE_DEBUG",
          },
        },
      },
      INSTRUCTIONS_Avatar: {
        on: {
          next: {
            target: "INSTRUCTIONS_service",
            internal: false,
          },
        },
      },
      SETUP_Application: {
        on: {
          run: {
            target: "Application_RUNNING",
            internal: false,
          },
        },
      },
      CREDITS: {
        on: {
          close: {
            target: "TITLE_SCREEN",
            internal: false,
          },
          end: {
            target: "TITLE_SCREEN",
          },
        },
      },
      SETUP_ENDLESS: {
        on: {
          run: {
            target: "ENDLESS_MODE",
            internal: false,
          },
        },
      },
      SCENE_DEBUG: {
        on: {
          close: {
            target: "TITLE_SCREEN",
          },
        },
      },
      INSTRUCTIONS_service: {
        on: {
          next: {
            target: "INSTRUCTIONS_CAST",
            internal: false,
          },
        },
      },
      Application_RUNNING: {
        on: {
          pause: {
            target: "PAUSED",
            internal: false,
          },
          "Application-over": {
            target: "Application_OVER_ANIMATION",
            internal: false,
          },
          OumaPortfolios: {
            target: "OumaPortfolio_OVERLAY",
            internal: false,
          },
          win: {
            target: "WIN_ANIMATION",
          },
          special: {
            target: "SPECIAL_OumaPortfolio",
          },
        },
      },
      ENDLESS_MODE: {
        on: {
          end: {
            target: "CLEAR_ENDLESS",
            internal: false,
          },
          pause: {
            target: "ENDLESS_PAUSE",
            internal: false,
          },
          OumaPortfolios: {
            target: "ENDLESS_OumaPortfolio_OVERLAY",
          },
          special: {
            target: "ENDLESS_SPECIAL_OumaPortfolio",
          },
        },
      },
      INSTRUCTIONS_CAST: {
        on: {
          next: {
            target: "INSTRUCTIONS_OumaPortfolioS",
            internal: false,
          },
        },
      },
      PAUSED: {
        on: {
          resume: {
            target: "Application_RUNNING",
            internal: false,
          },
          end: {
            target: "CLEAR_Application",
          },
        },
      },
      Application_OVER_ANIMATION: {
        on: {
          end: {
            target: "Application_OVER",
            internal: false,
          },
        },
      },
      OumaPortfolio_OVERLAY: {
        on: {
          close: {
            target: "Application_RUNNING",
            internal: false,
          },
        },
      },
      WIN_ANIMATION: {
        on: {
          end: {
            target: "utilisateur",
          },
        },
      },
      SPECIAL_OumaPortfolio: {
        on: {
          complete: {
            target: "Application_RUNNING",
          },
          win: {
            target: "WIN_ANIMATION",
          },
        },
      },
      CLEAR_ENDLESS: {
        on: {
          end: {
            target: "TITLE_SCREEN",
            internal: false,
          },
        },
      },
      ENDLESS_PAUSE: {
        on: {
          end: {
            target: "CLEAR_ENDLESS",
            internal: false,
          },
          resume: {
            target: "ENDLESS_MODE",
            internal: false,
          },
        },
      },
      ENDLESS_OumaPortfolio_OVERLAY: {
        on: {
          close: {
            target: "ENDLESS_MODE",
          },
        },
      },
      ENDLESS_SPECIAL_OumaPortfolio: {
        on: {
          complete: {
            target: "ENDLESS_MODE",
          },
        },
      },
      INSTRUCTIONS_OumaPortfolioS: {
        on: {
          next: {
            target: "SETUP_Application",
            internal: false,
          },
        },
      },
      CLEAR_Application: {
        on: {
          end: {
            target: "TITLE_SCREEN",
            internal: false,
          },
        },
      },
      Application_OVER: {
        on: {
          restart: {
            target: "SETUP_Application",
            internal: false,
          },
          instructions: {
            target: "RESETTING_FOR_INSTRUCTIONS",
            internal: false,
          },
          credits: {
            target: "RESETTING_FOR_CREDITS",
            internal: false,
          },
          endless: {
            target: "SETUP_ENDLESS",
            internal: false,
          },
        },
      },
      utilisateur: {
        on: {
          restart: {
            target: "SETUP_Application",
          },
          instructions: {
            target: "INSTRUCTIONS_Avatar",
          },
          credits: {
            target: "CREDITS",
          },
          endless: {
            target: "SETUP_ENDLESS",
          },
        },
      },
      RESETTING_FOR_INSTRUCTIONS: {
        on: {
          run: {
            target: "INSTRUCTIONS_Avatar",
          },
        },
      },
      RESETTING_FOR_CREDITS: {
        on: {
          run: {
            target: "CREDITS",
          },
        },
      },
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
  },
  {
    actions: {},
    services: {},
    guards: {},
    delays: {},
  }
)

export { AppMachine }
