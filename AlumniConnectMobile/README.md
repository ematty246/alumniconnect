# AlumniConnect Mobile

A React Native mobile application for connecting alumni, students, and faculty members.

## Features

- User authentication (login/register)
- Profile management for students, alumni, and faculty
- Connection requests and management
- Real-time chat functionality
- Webinar creation and participation
- User search and discovery

## Prerequisites

- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AlumniConnectMobile
```

2. Install dependencies:
```bash
npm install
```

3. For iOS (macOS only):
```bash
cd ios && pod install && cd ..
```

## Running the App

### Android
```bash
npm run android
```

### iOS (macOS only)
```bash
npm run ios
```

### Start Metro Bundler
```bash
npm start
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts for state management
├── navigation/         # Navigation configuration
├── screens/           # Screen components
│   ├── auth/          # Authentication screens
│   ├── chat/          # Chat screens
│   ├── connections/   # Connection management screens
│   ├── profile/       # Profile screens
│   └── webinar/       # Webinar screens
├── services/          # API services
└── styles/            # Global styles and theme
```

## Key Dependencies

- `@react-navigation/native` - Navigation
- `@react-navigation/stack` - Stack navigation
- `@react-navigation/bottom-tabs` - Tab navigation
- `react-native-vector-icons` - Icons
- `axios` - HTTP client
- `@react-native-async-storage/async-storage` - Local storage
- `react-native-image-picker` - Image selection
- `react-native-webview` - WebView component

## Backend Integration

The app connects to the following backend services:
- Authentication Service: `http://localhost:8081`
- Profile Service: `http://localhost:8082`
- Connection Service: `http://localhost:8083`
- Chat Service: `http://localhost:8084`
- Webinar Service: `http://localhost:8086`

Make sure these services are running before using the mobile app.

## Styling

The app uses a custom design system with:
- Consistent color palette
- Typography scale
- Spacing system
- Component styles
- Shadow effects

All styles are defined in `src/styles/globalStyles.ts`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.