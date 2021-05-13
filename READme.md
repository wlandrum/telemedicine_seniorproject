# Usage

1. Clone or download the repository
2. Run `npm install` in command line to install node modules
3. Create `.env` file and define the variables listed below
4. Run `npm run server` in command line

# Current Routes

| Route                           | Method | Description                            | Access     | Required Data                                                                  |
| ------------------------------- | :----: | -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| /                               |  GET   | Gets the homepage                      | Public     | none                                                                           |
| /login                          |  GET   | Shows the login page                   | Public     | none                                                                           |
| /api/auth                       |  GET   | Test route: displays current user info | Signed in  | none                                                                           |
| /api/auth                       |  POST  | Login using the provided info          | Public     | email, password                                                                |
| /api/auth/logout                |  POST  | Logout                                 | Signed out | none                                                                           |
| /api/users                      |  POST  | Register a new user                    | Public     | email, password, first_name, last_name                                         |
| /api/events                     |  GET   | Shows the user's events                | Signed in  | none                                                                           |
| /api/events                     |  POST  | Create a new event                     | Signed in  | datetime, name, description                                                    |
| /api/events/:eventId            | DELETE | Deletes the specified event            | Signed in  | eventId where event.user_id == user.id                                         |
| /api/events/appointment         |  POST  | Creates a new appointment              | Signed in  | datetime, [patient or doctor], duration, notes                                 |
| /api/events/appointment/:apptId | DELETE | Deletes the specified appointment      | Signed in  | apptId where appt.patient_id == user.id or appt.doctor_id == user.id           |
| /api/messages                   |  GET   | Get messages with assigned doctor      | patient    | none                                                                           |
| /api/messages                   |  POST  | Send a message                         | Patient    | content                                                                        |
| /api/messages                   |  GET   | Get list of patients to message        | doctor     | none                                                                           |
| /api/messages/:patientId        |  GET   | Get messages with patient              | doctor     | :patientId                                                                     |
| /api/messages/:patientId        |  POST  | Send a message to patient              | doctor     | :patientId, Content                                                            |
| /api/profile                    |  PUT   | Update profile information             | Signed in  | Any of the following: first_name, last_name, phone, dob, height, weight, email |
| /api/profile/password           |  PUT   | Change password                        | Signed in  | password, confirm_password                                                     |
| /api/profile/address            |  PUT   | Change address                         | Signed in  | street, city, state, zip                                                       |

# .env

This file is used to define environment variables

| Variable Name  |             Description             | Default             |
| -------------- | :---------------------------------: | ------------------- |
| PORT           |  The port to be used by the server  | 5000                |
| DB_HOST        |  Hostname where MySQL DB is hosted  | localhost           |
| DB_USER        |        Username for DB user         | root                |
| DB_PASSWORD    |           Password for DB           |                     |
| DATABASE       |         MySQL database name         | telemedicine        |
| DB_PORT        |  The port to be used for MySQL DB   | 3306                |
| SESSION_SECRET | Secret key to sign express sessions | telemedicine-portal |
| SESSION_NAME   |     Name of the session cookie      | sid                 |

# Test User Info

| Email              |  Password  | Type    |
| ------------------ | :--------: | ------- |
| asv@gmail.com      |  23What$a  | Patient |
| sam.wood@gmail.com | password1$ | Patient |
| J.B@gmail.com      |  123$45a   | Patient |
| E.Musk@gmail.com   |  Elon@23   | Patient |
| jd@gmail.com       |  1234a!A   | Patient |
| Omar@gmail.com     |   Omar1!   | Patient |
| email@gmail.com    | Password1$ | Doctor  |
| asdx@gmail.com     |  Doctor1$  | Doctor  |
| test@gmail.com     |  Doctor1$  | Doctor  |
| testing@gmail.com  |  Doctor1$  | Doctor  |
| Z.S@gmail.com      | 123456aA#  | Doctor  |
