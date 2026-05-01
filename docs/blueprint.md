# **App Name**: PACSA Ops Console

## Core Features:

- PIN Lock Screen & Access Control: Secure the application with a PIN-based lock screen. Authenticate users based on predefined PINs (Admin, Supervisor, Guard) to enable role-specific access to system functionalities.
- Admin Dashboard Access: Access the administrative control panel via the Admin PIN, granting full system management capabilities.
- Supervisor Module Access: Access the supervisor functionalities using the Supervisor PIN, providing oversight capabilities.
- Guard Interface Access: Access the guard-specific interface using the Guard PIN for task management and basic functions.
- Guard Registration Form: Within the Admin Dashboard, register new security guards using a form that dynamically loads available 'projects' from the 'projects' Firestore collection for selection.
- Real-time Shift Status Table: Display a live, updating table showing active shift registrations, fetching guardName, clientName, projectCode, entryTime, and shiftType data from the 'shift-registrations' Firestore collection.
- Firebase Project Connection: Connect to the specified Firebase project 'studio-8627810775-49878' to manage and retrieve data from Firestore collections.

## Style Guidelines:

- The chosen dark color scheme evokes the professional and controlled environment of security operations, aligning with a focus on efficiency and vigilance during all hours. A deep and reliable primary blue, with high saturation to maintain visibility, enhances professionalism on a dark backdrop. The background color supports this with a desaturated blue-grey, suggesting technical precision and calm. The accent color, a vibrant cyan, offers clear contrast for key actions or highlighted information without detracting from the overall serious tone.
- Primary color: #66A3E6 (a professional and strong blue).
- Background color: #1E272E (a very dark blue-grey for the dark theme).
- Accent color: #26D1EB (a bright cyan, analogous to the primary blue).
- Headline and body font: 'Inter', a grotesque-style sans-serif for its modern, objective, and highly readable qualities, suitable for operational data and clear navigation.
- Use clean, minimalistic line-art icons that complement the modern, professional dark theme without adding visual clutter. Icons should be easily decipherable and convey their purpose clearly, especially for system statuses and actions.
- Adopt a structured, modular layout with distinct sections for the dashboard elements, guard registration forms, and the real-time shift table. Utilize clear separation through cards or panels on the dark background to improve content readability and navigability.
- Implement subtle, fast-paced transitions for state changes, data loading, and modal interactions to enhance the user experience without being distracting. Animations should feel crisp and functional, reflecting the app's operational purpose.