<img src="https://specifysoftware.org/brand/sp-logo-horz.svg" width="300" alt="Specify Collections Consortium">

## **Specify Collections Management Platform**

The [Specify Collections Consortium](https://www.specifysoftware.org) (SCC) is proud to present **Specify 7**, a web-based application for managing biological collections data. Specify supports and enhances data management for biological collections, with a focus on research collections at universities, natural history museums, biorepositories, seed banks, herbaria, and environmental organizations. It offers incredible tools for data management, superb accessibility, and a multitude of collaboration features. It is completely free-to-use and 100% open source, supported by an active community of institutions from around the world. [Click here to learn more about our members](https://www.specifysoftware.org/members/).

Specify manages species and specimen information to computerize biological collections, track museum specimen transactions, link images to specimen records, and publish catalog data online. It supports collaborative digitization projects and remote hosting of specimen databases. Users do not need to install the software, enabling you and your collaborators to access a shared collections database from any modern web browser.

You can select, organize, rename, and resize the data entry forms to match your curatorial preferences, eliminating the need to tab through multiple forms. Specify's "tree" interface for taxonomy, geography, storage location, chronostratigraphy, and lithostratigraphy offer intuitive access to hierarchical data. This allows for easy editing, synonymization, re-parenting, and discovering linked collection objects and preparations.

The platform supports data from specimens, taxonomic and stratigraphic classifications, field notebooks, DNA sequence runs, literature references, and other primary sources. It can manage information related to repository agreements, accessions, conservation treatments, collection object groups, images, and other document attachments.

Specify prioritizes security with support for Single Sign-On (SSO), integrating seamlessly with institutional identity providers that utilize OpenID endpoints. The Security and Accounts tool empowers administrators to manage user access based on defined roles and policies. You can easily create, edit, and replicate roles across collections and databases, granting users tailored permissions that range from guest access to full collection management.

Specify is developed with accessibility at its core, meeting and exceeding international standards. It largely complies with the WCAG 2.1 (AA) guidelines, ensuring compatibility with screen readers. You can read more in our [Accessibility & Compatibility Summary (WCAG 2.1 Level AA)](https://discourse.specifysoftware.org/t/accessibility-compatibility-summary-wcag-2-1-level-aa/2870). Users can customize their visual experience by adjusting color schemes, reducing motion, and resizing elements. Our design respects user preferences for date formats, language, themes, and animations, creating a more personalized experience for everyone.

Whether you choose to self-host on your own infrastructure or use our [Specify Cloud](https://www.specifysoftware.org/products/cloud/) service, your institution retains full ownership and control of your data at all times. Specify imposes no vendor lock-in as your database runs on standard MariaDB, can be backed up or migrated at any time, and remains entirely yours. If your institution has strict data sovereignty or on-premises hosting requirements, the [self-hosted Docker/Podman deployment](#self-hosted-docker--podman) puts you in complete control of your infrastructure, security policies, and data access.

To get started, [send us a message to learn more](mailto:membership@specifysoftware.org)! We are happy to meet with you and your team to discuss how we can address your collections data management needs with Specify.

> [!IMPORTANT]  
> You can learn more about Specify, ask questions, share updates, and get involved with the community on the [Specify Community Forum](https://discourse.specifysoftware.org)!

---

## Table of Contents

- [Installation](#installation)
  - [Specify Cloud (Recommended)](#specify-cloud-recommended)
  - [Self-hosted (Docker / Podman)](#self-hosted-docker--podman)
  - [Development Setup](#development-setup)
- [Tech Stack](#tech-stack)
- [Specify Components](#specify-components)
  - [Specify 7](#specify-7)
  - [Specify Worker](#specify-worker)
  - [Specify Asset Server](#specify-asset-server)
  - [Specify Report Runner](#specify-report-runner)
  - [Localizing Specify](#localizing-specify)

---

# Installation

We encourage all users to read our documentation on the Community Forum
regarding installing and deploying Specify –
[**Specify 7 Installation Instructions**](https://discourse.specifysoftware.org/t/specify-7-installation-instructions/755).

If you are an existing Specify 6 user who is looking to evaluate Specify 7, you can
contact [support@specifysoftware.org](mailto:support@specifysoftware.org)
along with a copy of your database and we can configure a temporary deployment
for evaluation purposes.

## Specify Cloud (Recommended)

Our hosting platform, Specify Cloud, enables biological collections to easily share their current Specify database with us. If a collection is new to Specify, we are happy to create a new database [upon request](mailto:membership@specifysoftware.org)! We handle all updates, maintenance, backups, resource management, billing, and asset management. Our cloud platform has regions located worldwide, enabling Specify to be hosted near your collection and staff. We will collaborate with your team to ensure compliance with all institutional and legal regulations regarding data storage and accessibility. Your local IT teams can request access to our cloud servers to prepare backups, access assets, and connect to your database directly whenever necessary. This platform also enables our support team to respond to inquiries quickly and resolve any issues.

## Self-hosted (Docker / Podman)

For institutions that require their collections data to remain on-site or in a region not served by Specify Cloud, Specify 7 is designed to be deployed using [Docker](https://www.docker.com/) or [Podman](https://podman.io/). The project provides a [Dockerfile](./Dockerfile) based on Ubuntu and [docker-compositions](https://github.com/specify/docker-compositions) that bundle Specify 7 with its supporting services (MariaDB, Redis, Asset Server, Report Runner). This is the only supported production self-hosted deployment method.

We encourage SCC members to use our [Dockerized compositions](https://github.com/specify/docker-compositions) of Specify 7. You can choose your desired version, make the necessary adjustments and then run a single command to get everything working. It is very simple and can be easily updated when new versions are released. Documentation for deploying Specify using Docker/Podman is available within the repository.

[**📨 Click here to request access**](mailto:support@specifysoftware.org?subject=Requesting%20Docker%20Repository%20Access&body=My%20GitHub%20username%20is%3A%20%0D%0AMy%20Specify%20Member%20Institution%20is%3A%20%0D%0AAdditional%20Questions%20or%20Notes%3A%20), including your GitHub username, member institution, collection, and any additional questions or notes you have for us.

## Development Setup

For contributing to Specify 7, the recommended approach is a [Docker/Podman-based development workflow](https://discourse.specifysoftware.org/t/guide-to-contributing-code-to-specify/3511). The included [Dockerfile](./Dockerfile) provides a multi-stage build with a dedicated `run-development` stage that includes testing dependencies and tools like mypy. If you are interested in contributing to Specify, please read our [guide to contributing code to Specify](https://discourse.specifysoftware.org/t/guide-to-contributing-code-to-specify/3511) for instructions!

If you want to contribute to our code from an external institution, please reach out to a [member of our team](mailto:support@specifysoftware.org) for further guidance. We are always looking for new collaboration opportunities.

---

# Tech Stack

- **Host:** Ubuntu on Docker / Podman
- **Database Management System:** MariaDB
- **Front-end:** TypeScript, React, JavaScript, Tailwind CSS
- **Back-end:** Django and Python

You can learn more about the architecture here: https://discourse.specifysoftware.org/t/specify-7-architecture-overview/

---

# Specify Components

A full Specify 7 deployment consists of several services working together. The Docker / Podman compositions bundle all of these into a single, cohesive container stack.

## Specify 7

The main web application — a Django-powered backend serving a React and TypeScript frontend. This is the browser-based interface that users interact with to manage their collections data. It handles authentication (including SSO via OpenID Connect), business logic, schema management, and all CRUD operations against the MariaDB database. The application is served via Gunicorn in production and includes a built-in development server for local testing.

## Specify Worker

A background job processor that handles long-running or resource-intensive operations asynchronously, keeping the main web application responsive. It is responsible for:

- **WorkBench uploads** — processing and validating large datasets uploaded through the Specify WorkBench tool
- **Record merging** — executing complex record merge operations across related tables
- **Batch attachment uploads** — handling bulk image and document attachment processing

The worker process is built on [Celery](https://docs.celeryproject.org/en/master/index.html), a distributed task queue, with [Redis](https://docs.celeryproject.org/en/master/getting-started/backends-and-brokers/redis.html) serving as the message broker. It is included alongside every Specify 7 deployment.

## Specify Asset Server

The [Web Asset Server](https://discourse.specifysoftware.org/t/specify-web-asset-server-attachment-server/715) manages the storage and retrieval of binary file attachments such as specimen images, scanned documents, field notes, and other media files linked to collection records. It stores assets independently from the main application database, enabling efficient serving of large files without impacting database performance. The Asset Server supports configurable storage backends and collection-based organization of assets.

* Learn about [Attachments in Specify](https://discourse.specifysoftware.org/t/attachments-in-specify/190)
* See how [Specify works with the Web Asset Server](https://discourse.specifysoftware.org/t/how-does-specify-7-work-with-the-web-asset-server/2817)
* Read the [technical docs for the Web Asset Server](https://discourse.specifysoftware.org/t/web-asset-server/657)

## Specify Report Runner

The [Report Runner Service](https://github.com/specify/report-runner-service) generates formatted, printable reports from Specify data. It processes report templates against collection records to produce PDFs of invoices and labels. This service handles the rendering pipeline independently so that complex report generation does not block the main application. If you are interested in adding additional fonts for use in reports and labels, see [these instructions here](https://discourse.specifysoftware.org/t/specify-report-runner-fonts/1659).

## Localizing Specify

Specify 7 interface is available in several languages out of the box, including English, Ukrainian, Russian, German, and French. We are using [Weblate](https://hosted.weblate.org/projects/specify-7/) continuous localization platform, and if you are interested in amending our existing localization or would like us to add a new language to Specify, please see our [instructions on how you can contribute](https://discourse.specifysoftware.org/t/get-started-with-specify-7-localization/956).

---

_The Specify Collections Consortium is funded by its member institutions. Find out more at [https://specifysoftware.org](https://specifysoftware.org)_