# [Specify 7](https://www.specifysoftware.org/products/specify-7/)

## **Specify Collections Management Platform**

The [Specify Collections Consortium](https://www.specifysoftware.org) (SCC) is proud to present **Specify 7**, a web-based application for managing biological collections data. Specify supports and enhances data management for biological collections, with a focus on research collections at universities, natural history museums, biorepositories, seed banks, herbaria, and environmental organizations. It offers incredible tools for data management, superb accessibility, and a multitude of collaboration features. It is completely free-to-use and 100% open source, supported by an active community of institutions from around the world. [Click here to learn more about our members](https://www.specifysoftware.org/members/).

Specify manages species and specimen information to computerize biological collections, track museum specimen transactions, link images to specimen records, and publish catalog data online. It supports collaborative digitization projects and remote hosting of specimen databases. Users do not need to install the software, enabling you and your collaborators to access a shared collections database from any modern web browser.

You can select, organize, rename, and resize the data entry forms to match your curatorial preferences, eliminating the need to tab through multiple forms. Specify's "tree" interface for taxonomy, geography, storage location, chronostratigraphy, and lithostratigraphy offer intuitive access to hierarchical data. This allows for easy editing, synonymization, re-parenting, and discovering linked collection objects and preparations.

The platform supports data from specimens, taxonomic and stratigraphic classifications, field notebooks, DNA sequence runs, literature references, and other primary sources. It can manage information related to repository agreements, accessions, conservation treatments, collection object groups, images, and other document attachments.

Specify prioritizes security with support for Single Sign-On (SSO), integrating seamlessly with institutional identity providers that utilize OpenID endpoints. The Security and Accounts tool empowers administrators to manage user access based on defined roles and policies. You can easily create, edit, and replicate roles across collections and databases, granting users tailored permissions that range from guest access to full collection management.

Specify is developed with accessibility at its core, meeting and exceeding international standards. It largely complies with the WCAG 2.1 (AA) guidelines, ensuring compatibility with screen readers. Users can customize their visual experience by adjusting color schemes, reducing motion, and resizing elements. Our design respects user preferences for date formats, language, themes, and animations, creating a more personalized experience for everyone.

To get started, [send us a message to learn more](mailto:membership@specifysoftware.org)! We are happy to meet with you and your team to discuss how we can address your collections data management needs with Specify.

---

_The Specify Collections Consortium is funded by its member institutions. The Consortium web site is: [https://specifysoftware.org](https://specifysoftware.org)_

```
Specify 7 Copyright © 2024 Specify Collections Consortium. Specify comes with ABSOLUTELY NO WARRANTY. This is free software licensed under GNU General Public License 2 (GPL2).
```

---

# Installation

## [Specify Cloud](https://www.specifysoftware.org/products/cloud/) (Recommended)

Our hosting platform, Specify Cloud, enables biological collections to easily share their current Specify database with us. If a collection is new to Specify, we are happy to create a new database [upon request](membership@specifysoftware.org)! We handle all updates, maintenance, backups, resource management, billing, and asset management. Our cloud platform has regions located worldwide, enabling Specify to be hosted near your collection and staff. We will collaborate with your team to ensure compliance with all institutional and legal regulations regarding data storage and accessibility. Your local IT teams can request access to our cloud servers to prepare backups, access assets, and connect to your database directly whenever necessary. This platform also enables our support team to respond to inquries quickly and resolve any issues.

## Self-hosted

If your institution or local government require that your collections data remain on-site or in a region that the Specify Cloud service cannot accommodate, Specify can also be easily self-hosted on-site! This approach means that your IT support will need to be responsible for managing the server hosting Specify and the associated assets, updates, and day-to-day accesss troubleshooting. We encourage SCC members to use our [Dockerized compositions](https://github.com/specify/docker-compositions) of Specify 7.

[**📨 Click here to request access**](mailto:support@specifysoftware.org?subject=Requesting%20Docker%20Repository%20Access&body=My%20GitHub%20username%20is%3A%20%0D%0AMy%20Specify%20Member%20Institution%20is%3A%20%0D%0AAdditional%20Questions%20or%20Notes%3A%20), including your GitHub username, member institution,  collection, and any additional questions or notes you have for us.

## Development

You can follow [these instructions to set up a development environment](https://github.com/specify/specify7/wiki/Docker-Workflow-for-Development) using Docker! If you want to contribute to our code from an external institution, please reach out to a [member of our team](mailto:support@specifysoftware.org) for further guidance. We are always looking for new collaboration opportunities.

# Tech Stack

- **Host:** Ubuntu on Docker
- **Database Management System:** MariaDB (_MySQL-based_)
- **Front-end:** TypeScript, React, JavaScript, Tailwind CSS
- **Back-end:** Django and Python

# Additional Information

## Specify Components

### Specify 7

This is the main Specify 7 application!

### Specify Worker

The Specify WorkBench, record merging utility, and batch attachment uploader use this dedicated worker process to handle any and all upload, validation, and merging processes. This component is included alongside every Specify 7 deployment to ensure these actions can be

Behind-the-scenes, this worker process utilizes [Celery](https://docs.celeryproject.org/en/master/index.html), a job queue management system, with [Redis](https://docs.celeryproject.org/en/master/getting-started/backends-and-brokers/redis.html) serving as the broker.

### Specify Asset Server

### Specify Report Runner

## Localizing Specify

Specify 7 interface is available in several languages out of the box, including English, Ukrainian, Russian, German, and French. We are using [Weblate](https://hosted.weblate.org/projects/specify-7/) continuous localization platform, and if you are interested in amending our existing localization or would like us to add a new language to Specify, please see our [instructions on how you can contribute](https://discourse.specifysoftware.org/t/get-started-with-specify-7-localization/956)!
