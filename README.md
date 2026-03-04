# Social Media Automation Web Application

## One-line Project Aim
The aim of this project is to build a secure social media automation system where users can connect their real social media accounts using OAuth and manage scheduled posts from a single unified dashboard.

## Project Description
This project is a Social Media Automation Web Application built using **Antigravity UI** and a **Next.js (TypeScript)** backend. The main goal of this project is to allow users to manage and schedule posts for multiple social media platforms such as **Instagram**, **LinkedIn**, and **Twitter** from a single dashboard.

The application uses **Composio** as an integration and OAuth middleware layer. When a user clicks on a platform like Instagram in the sidebar, the system redirects the user to the official Instagram login page through Composio. The user logs in using their real Instagram account, and after successful authentication, the account gets securely connected to the application.

Only after this official connection, the user can create, schedule, and publish posts directly to their original Instagram account from the project. The same secure flow is followed for LinkedIn and Twitter, ensuring that all posts are published through official platform APIs using OAuth-based authentication.

## Simplified Description
This project is a Social Media Automation Application where users can schedule and publish posts to Instagram, LinkedIn, and Twitter from one dashboard. The UI is built using Antigravity, and the backend is developed using Next.js with TypeScript. Composio is used as a middleware platform for connecting real user accounts. When the user clicks Instagram in the sidebar, they are redirected to the official Instagram login page using Composio OAuth. After logging in with their original account, the connection is established securely. Then only the user can schedule and publish posts from the application to their real Instagram account. This ensures secure, official, and automated social media posting.
