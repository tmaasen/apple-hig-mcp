---
title: "Icloud"
platform: universal
category: technologies
url: https://developer.apple.com/design/human-interface-guidelines/icloud
id: icloud-universal
lastUpdated: 2025-06-30T12:46:33.405Z
extractionMethod: enhanced-turndown
qualityScore: 0.800
confidence: 1.000
contentLength: 4570
structureScore: 0.500
cleaningScore: 0.108
hasCodeExamples: false
hasImages: false
keywords: ["june", "2025", "added", "guidance", "synchronizing", "game", "data", "through", "icloud", "service"]
---
## Overview

June 9, 2025 Added guidance for synchronizing game data through iCloud. iCloud iCloud is a service that lets people seamlessly access the content they care about — photos, videos, documents, and more — from any device, without performing explicit synchronization. A fundamental aspect of iCloud is transparency. People don’t need to know where content resides. They can just assume they’re always accessing the latest version. Best practices Make it easy to use your app with iCloud. People turn on iCloud in Settings and expect apps to work with it automatically. If you think people might want to choose whether to use iCloud with your app, show a simple option the first time your app opens that provides a choice between using iCloud for all data or not at all. Avoid asking which documents to keep in iCloud. Most people expect all of their content to be available in iCloud and don’t want to manage the storage of individual documents. Consider how your app handles and exposes content, and try to perform more file-management tasks automatically. Keep content up to date when possible. In an app that supports iCloud, it’s best when people always have access to the most recent content. However, you need to balance this experience with respect to device storage and bandwidth constraints. If your app works with very large documents, it may be better to let people control when updated content is downloaded. If your app fits in this category, design a way to indicate that a more recent version of a document is available in iCloud. When a document is updating, provide subtle feedback if the download takes more than a few seconds. Respect iCloud storage space. iCloud is a finite resource for which people pay. Use iCloud to store information people create and understand, and avoid using it for app resources or content you can regenerate. Even if your app doesn’t implement iCloud support, remember that iCloud backups include the contents of every app’s Documents folder. To avoid using up too much space, be picky about the content you place in the Documents folder. Make sure your app behaves appropriately when iCloud is unavailable. If someone manually turns off iCloud or turns on Airplane Mode, you don’t need to display an alert notifying them iCloud is unavailable. However, it may still be helpful to unobtrusively let people know that changes they make won’t be available on other devices until they restore iCloud access. Keep app state information in iCloud. In addition to storing documents and other files, you can use iCloud to store settings and information about the state of your app. For example, a magazine app might store the last page viewed so when the app is opened on another device, someone can continue reading from where they left off. If you use iCloud to store settings, make sure it’s for ones people want applied to all of their devices. For example, some settings might be more useful at work than at home. Warn about the consequences of deleting a document. When someone deletes a document in an app that supports iCloud, the document is removed from iCloud and all other devices too. Show a warning and ask for confirmation before performing the deletion. Make conflict resolution prompt and easy. To the extent possible, try to detect and resolve version conflicts automatically. If this can’t be done, display an unobtrusive notification that makes it easy to differentiate and choose between the conflicting versions. Ideally, conflict resolution occurs as early as possible, so time isn’t wasted in the wrong version. Include iCloud content in search results. People with iCloud accounts assume their content is universally available, and they expect search results to reflect this perspective. For games, consider saving player progress in iCloud. Although you can implement this functionality yourself, the GameSave framework offers an efficient solution. It synchronizes save data across devices and offers built-in alerts you can use to help players handle syncing issues during offline play or when conflicts arise. Alternatively, you can implement custom UI that uses GameSave data to resolve these situations. For developer guidance, see GameSave. Platform considerations No additional considerations for iOS, iPadOS, macOS, tvOS, visionOS, or watchOS. Resources Developer documentation CloudKit GameSave Change log Date Changes June 9, 2025 Added guidance for synchronizing game data through iCloud. Current page is iCloud Supported platforms iCloud Best practices Platform considerations Resources Change log

## Related Concepts

- alert
- alerts

---

**Attribution Notice**

This content is sourced from Apple's Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/icloud

This content was successfully extracted and structured from Apple's official documentation.

© Apple Inc. All rights reserved. This content is provided for educational and development purposes under fair use. This MCP server is not affiliated with Apple Inc. and does not claim ownership of Apple's content.

For the most up-to-date and official information, please refer to Apple's official documentation.
