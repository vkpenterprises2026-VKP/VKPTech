export const vkpWhatsAppMenu = {
  greeting: "Welcome to VKP Technologies. Reply 1 Laptop/Desktop, 2 CCTV, 3 Networking, 4 Server, 5 Get Catalogue.",
  options: {
    "1": {
      interest: "Laptop/Desktop",
      reply: "Please share laptop/desktop quantity, configuration, budget, and delivery location."
    },
    "2": {
      interest: "CCTV",
      reply: "Please share camera count, indoor/outdoor areas, storage days, and installation location."
    },
    "3": {
      interest: "Networking",
      reply: "Please share switch/router/WiFi requirement, user count, and site location."
    },
    "4": {
      interest: "Server",
      reply: "Please share workload, users, storage, backup needs, and budget."
    },
    "5": {
      interest: "Catalogue",
      document: process.env.WHATSAPP_CATALOGUE_PDF
    }
  },
  followUpMinutes: 10
};
