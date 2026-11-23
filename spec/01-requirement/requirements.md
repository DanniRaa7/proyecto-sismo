# 01 - General Requirement

## Problem Statement

After the August 10 earthquake in Cali, commercial zones near the epicenter, schools (including damaged classrooms such as Block 6), hospitals, perimeter neighborhood roads, construction material supply chains, and family homes suffered severe disruption. Citizens, field engineers, the Risk Management Unit (UDGR), and insurance companies need one simple, trustworthy platform to coordinate recovery.

## System Goal

Build a simple web application in Vanilla JavaScript so clear that even a child can understand the traffic-light colors (**Green = Safe**, **Yellow = At Risk**, **Red = Uninhabitable / Urgent Help**). The system connects two modules to one shared data core:

1. **Public View (Big Data & Business Intelligence)**:
   - Displays live city statistics across 6 affected sectors (`economy`, `health`, `infrastructure`, `education`, `logistics`, `housing`).
   - Highlights uninsured high-risk families, uninhabitable buildings, and ambulance dispatch demand.
   - Allows owners and tenants to search the habitability and insurance claim status of their property.
2. **Private View (Field Inspection & Triage Tool)**:
   - Enables Civil Engineers, Architects, Topographers, and UDGR officers to log photo evidence and damage inventories.
   - Reconciles the technical damage verdict (`superficial`, `chronic`, `structural`) with the official UDGR habitability status (`safe`, `atRisk`, `uninhabitable`) to resolve claims across `insured`, `mortgage`, `leasing`, and `uninsured` properties.
   - Classifies citizens by age (`<10`, `>10`, `>=18`, `>=60`), care conditions (`hasDisability`, `isVulnerable`, `hasSpecialNeeds` requiring ambulance), and population groups (`civilian`, `military`, `prison`).
