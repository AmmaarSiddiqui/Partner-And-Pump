# Partner & Pump: User Manual

Welcome to Partner & Pump! 🏋️‍♂️ This manual will guide you through accessing, setting up, and using our app to find your next great workout partner.

## 1. What is Partner & Pump?

Partner & Pump is an iOS app designed to connect you with the perfect gym partner.

Our goal is to make your fitness journey more consistent, motivating, and fun. Unlike general social media apps, Partner & Pump is built specifically to find compatible partners based on the things that matter for a good workout:

* **Workout Goals:** (e.g., strength, endurance, aesthetics)
* **Training Style:** (e.g., Push/Pull/Legs, Upper/Lower)
* **Workout Schedule & Availability**
* **Gym Location**

Whether you're looking for a one-time spotter for a heavy lift today (**"Pump Now"**) or a consistent, long-term partner to match your weekly schedule, our app helps you find the right person.

Partner & Pump will also give users access to a social "Discover" feed to share achievements and connect with others.

## 2. Installation & Setup

As Partner & Pump is currently in active development, it is not yet hosted on the App Store. To access the app, you will need to install the development environment and the Expo Go client.

### Prerequisites
Before starting, ensure you have the following ready:
* **Source Code Management:** Git installed on your computer.
* **Runtime Environment:** Node.js installed.
* **Mobile Device:** An iOS (iOS 15+) connected to the same Wi-Fi network as your computer.
* **Expo Go App:** Download the Expo Go app on your mobile device.
    * **iOS:** Download from the Apple App Store.

### Installing the Project

1.  **Clone the Repository**
    Open your terminal/command prompt and run the following command to download the source code:
    ```bash
    git clone https://github.com/AmmaarSiddiqui/Partner-And-Pump.git
    ```

2.  **Navigate to the Directory**
    ```bash
    cd Partner-And-Pump
    ```

3.  **Install Dependencies**
    
    **First, install the Firebase tools globally.**
    * **Windows users:** Run `npm i -g firebase-tools`
    * **macOS/Linux users:** You will likely need to use `sudo` to grant permission:
        ```bash
        sudo npm i -g firebase-tools
        ```

    **Next, install the project's local dependencies:**
    ```bash
    npm install
    ```

## 3. Launching the Application

Once the installation is complete, follow these steps to launch the app on your device.

1.  **Start the Expo Server**
    Run the following command in your terminal to clear the cache and start the Metro Bundler:
    ```bash
    npx expo start -c
    ```

2.  **Connect Your Device**
    Once the server starts, you will see a QR code generated in your terminal window.
    * **Open the Expo Go app** on your phone.
    * **Scan the QR Code:**
        * **iOS:** Use your standard Camera app to scan the QR code, which will prompt you to open Expo Go.

3.  **App Initialization**
    The Javascript bundle will begin building on your computer and transferring to your phone. Once it reaches 100%, the Partner & Pump login screen will appear on your mobile device.

## 4. Troubleshooting Common Issues

### Permission Denied / EACCES Error
If you run `npx expo start -c` and receive an error message containing `npm error code EEXIST` or `EACCES: permission denied`, it is likely due to a permissions conflict in your local npm cache (often caused by running npm with `sudo` in the past).

**To resolve this:**
1.  Run the following command to reclaim ownership of your npm directory:
    ```bash
    sudo chown -R $(whoami) ~/.npm
    ```
2.  Clear the npm cache:
    ```bash
    npm cache clean --force
    ```
3.  Try running the launch command again:
    ```bash
    npx expo start -c
    ```

## 5. How to Use the Software

Here are the main features of Partner & Pump and how to use them.

### Setting Up Your Account & Profile
When you first visit the app, you'll need to create an account. You can sign up using your email address.

During setup, you will be asked to fill out your profile with key information that we use for matching:
* Your name
* Your main fitness goals (e.g., strength, endurance, weight loss)
* Your primary gym location (you can set this by enabling location access in your browser or searching manually)

Afterwards, you can navigate to the profile to further update additional details for your profile. 

### Finding a Same-Day Partner ("Pump Now")
Use this feature when you need a partner for a single session, right now or later today.
1.  Navigate to the "**Match**" tab.
2.  Navigate to the "**Pump Now**" section.
3.  Click on the workout type you want a partner for.
4.  A list of available users who match your criteria shows, click on match for the user who best matches your preferences.
5.  Match request is sent and now you wait for the recipients response
6.  When they accept, a new chat will automatically open in your messages tab so you can coordinate the details (e.g., "Meet by the squat racks at 5:30?").
7.  To cancel a match, go to **Profile** and scroll down where you see your matches.
8.  WILL NOT SHOW ANYONE IF 0% COMPATIBILITY


### Finding a Long-Term Partner
Use this feature to find a consistent partner who matches your weekly routine and long-term goals.
1.  Navigate to the "**Match**" tab.
2.  Select the "**Long-Term Partner**" matching mode.
3.  Click on the workout type you want a partner for.
4.  A list of available users who match your criteria shows, click on match for the user who best matches your preferences.
5.  Match request is sent and now you wait for the recipients response
6.  When they accept, a new chat will automatically open in your messages tab so you can coordinate the details (e.g., "What days and times work best for you?").
7.  To cancel a match, go to **Profile** and scroll down where you see your matches.
8.  WILL NOT SHOW ANYONE IF 0% COMPATIBILITY


### The Discover Feed (In Development)
The "**Discover**" tab is our community social feed. This is a place to share your fitness journey and get motivated by others.
* **Create Posts:** You can share your Personal Records (PRs), workout highlight clips, progress pictures, or just a post about your workout.
* **Browse:** Scroll through the feed to see what other users in the community are up to.
* **Engage:** You can like and comment on posts to show support and connect with other users. You can also message users you find through the Discover feed.

### Messaging
You can send and receive direct messages within the app. A new chat thread is automatically created when:
* A user accepts your **same-day "Pump Now" request**.
* A user accepts your **long-term partnership request**.
* You choose to message someone from their **Discover feed post or profile**.

All your active conversations are saved in the "**Messages**" tab. You can enable browser notifications in your settings to be alerted to new messages.



### Home Page
You can see new match requests from users and see your current schedule down below for the day ahead.

You can click on the left and right arrows to switch the days the schedule shows, and if you click add, you can add various things to your schedule by filling in the schedule subject field and time (Date is from the left and right arrows).
You can edit/delete by clicking on entries in the schedule. 

### Upcoming Features
We are actively working on new features. The following functionality is planned but is currently a **work in progress**:
* **Workout Tracking & Sync:** The ability to log your workouts, track your consistency with partners, and sync data from fitness trackers and services.
* **Shared Workout Scheduling:** A tool to create custom workout routines (exercises, sets, reps) and share them directly with your partners within the app.

## 6. How to Report a Bug

We rely on your feedback to improve Partner & Pump! If you find a bug, error, or other issue, please let us know.

**Where to Report:**
All bugs should be reported on our public GitHub Issue Tracker:
[https://github.com/AmmaarSiddiqui/Partner-And-Pump/issues](https://github.com/AmmaarSiddiqui/Partner-And-Pump/issues)

**What to Include in Your Report:**
To help us fix the bug quickly, please include as much detail as possible:
* A **clear, descriptive title** (e.g., "Site crashes when I try to upload a photo to the Discover feed").
* **Steps to Reproduce:** The exact steps you took that caused the bug.
    * *Example: 1. Clicked the 'Discover' tab. 2. Clicked the '+' icon to create a post. 3. Clicked 'Add Photo' and selected an image. 4. The page froze and showed an error.*
* **Expected Behavior:** What you *thought* would happen.
* **Actual Behavior:** What *actually* happened (include any error messages you saw).

## 7. Known Bugs

We track all known issues, limitations, and bugs publicly on our GitHub Issue Tracker. Before reporting a new bug, you can check the list to see if it has already been reported.

View all known bugs and limitations here:
[https://github.com/AmmaarSiddiqui/Partner-And-Pump/issues](https://github.com/AmmaarSiddiqui/Partner-And-Pump/issues)
