# Partner & Pump: User Manual

Welcome to Partner & Pump! 🏋️‍♂️ This manual will guide you through accessing, setting up, and using our app to find your next great workout partner.
# Currently under development
A lot of these features are currently under development and will be updated/changed. 
The current flow may not match the current implementation but will be updated soon! 
Changes underdevelopment/currently different from manual: 
- Profile setup screen
- Pump now time window selection (currently under edit profile)
- Matching screen / compatibility score
- Discover feed (Currently unresponsive)
- Messaging (Currently unresponsive)

## 1. What is Partner & Pump?

Partner & Pump is an IOS app designed to connect you with the perfect gym partner.

Our goal is to make your fitness journey more consistent, motivating, and fun. Unlike general social media apps, Partner & Pump is built specifically to find compatible partners based on the things that matter for a good workout:

* **Workout Goals:** (e.g., strength, endurance, aesthetics)
* **Training Style:** (e.g., Push/Pull/Legs, Upper/Lower)
* **Workout Schedule & Availability**
* **Gym Location**

Whether you're looking for a one-time spotter for a heavy lift today (**"Pump Now"**) or a consistent, long-term partner to match your weekly schedule, our app helps you find the right person.

Partner & Pump will also give users access to a social "Discover" feed to share achievements and connect with others

## 2. How to Install the Software

Partner & Pump will be available for download on the app store soon. Users can go to the App store, search up Partner & Pump, and download to access the software and setup their profile.

### Prerequisites

* An ios device (IOS 15+)
* An internet connection.

## 3. How to Run the Software (Currently under development, not available on the app store for now)

1.  Download the Partner & Pump app on an IOS 15+ device.
2.  Navigate to the Partner & Pump App.
3.  If it is your first time, you will be guided through setting up your account and profile.

## 4. How to Use the Software

Here are the main features of Partner & Pump and how to use them.

### Setting Up Your Account & Profile

When you first visit the app, you'll need to create an account. You can sign up using your email address or a social login (Google/Apple).

During setup, you will be asked to fill out your profile with key information that we use for matching:

* Your name, gender, and fitness level (beginner, intermediate, advanced)
* Your main fitness goals (e.g., strength, endurance, weight loss)
* Your primary gym location (you can set this by enabling location access in your browser or searching manually)
* Your weekly workout availability (you can set the days and time blocks you are usually free to work out)

### Finding a Same-Day Partner ("Pump Now")

Use this feature when you need a partner for a single session, right now or later today.
1.  Navigate to the "**Match**" tab.
2.  Navigate to the "**Pump Now**" section.
3.  Enter the details for today's session:
    * **Workout Type:** (e.g., "Leg Day," "Push," "Full Body," "Cardio")
    * **Time Window:** (e.g., "Between 5:00 PM and 7:00 PM")
    * **Location:** (This will default to your primary gym but can be changed)
4.  Click search, and the app will show you a list of available users who match your criteria.
5.  You can click on a profile to see more details.
6.  If you find a good match, click "**Send Request**".
7.  When they accept, a new chat will automatically open in your messages tab so you can coordinate the details (e.g., "Meet by the squat racks at 5:30?").

### Finding a Long-Term Partner

Use this feature to find a consistent partner who matches your weekly routine and long-term goals.
1.  Navigate to the "**Match**" tab.
2.  Select the "**Long-Term Partner**" matching mode.
3.  The app will search for users based on your detailed profile information, prioritizing:
    * **Schedule Overlap:** People who are free on the same days and times as you.
    * **Workout Split:** People who follow a similar split (e.g., you both do Push/Pull/Legs).
    * **Goal Alignment:** People with similar fitness goals and experience levels.
4.  The app will show you a ranked list of potential partners with a compatibility score (e.g., "87% Match").
5.  You can browse these profiles and send a "**Partnership Request**" to those who look like a good fit.
6.  If they accept, a chat will open so you can discuss your schedules and plan your workouts.

### The Discover Feed

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

You can see posts of those you have matched with and like or comment to interact with them.
Users will be able to choose who will show up on their home page.


### Upcoming Features

We are actively working on new features. The following functionality is planned but is currently a **work in progress**:

* **Workout Tracking & Sync:** The ability to log your workouts, track your consistency with partners, and sync data from fitness trackers and services.
* **Shared Workout Scheduling:** A tool to create custom workout routines (exercises, sets, reps) and share them directly with your partners within the app.

## 5. How to Run the Software as a tester/developer

Install dependecies: 
```
npm i -g firebase-tools   # deploy/emulate backend
git clone https://github.com/AmmaarSiddiqui/Partner-And-Pump.git
cd Partner-And-Pump
npm ci
npx expo start -c
```


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
* **Your Environment:** Your Operating System (e.g., Windows 11, macOS Sonoma) and your Browser with its version (e.g., Chrome 125, Safari 17.1).

## 6. Known Bugs

We track all known issues, limitations, and bugs publicly on our GitHub Issue Tracker. Before reporting a new bug, you can check the list to see if it has already been reported.

View all known bugs and limitations here:
[https://github.com/AmmaarSiddiqui/Partner-And-Pump/issues](https://github.com/AmmaarSiddiqui/Partner-And-Pump/issues)
