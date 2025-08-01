# <img src="./public/favicon.svg" alt="Project Logo" width="30" height="30" style="vertical-align: middle; margin-right: 8px;"> GPT-IMAGE-1 Playground

A web-based playground to interact with OpenAI's `gpt-image-1` model for generating and editing images.

<p align="center">
  <img src="./readme-images/interface.jpg" alt="Interface" width="600"/>
</p>

## ✨ Features

*   **🎨 Image Generation Mode:** Create new images from text prompts.
*   **🖌️ Image Editing Mode:** Modify existing images based on text prompts and optional masks.
*   **⚙️ Full API Parameter Control:** Access and adjust all relevant parameters supported by the OpenAI Images API directly through the UI (size, quality, output format, compression, background, moderation, number of images).
*   **🎭 Integrated Masking Tool:** Easily create or upload masks directly within the editing mode to specify areas for modification. Draw directly on the image to generate a mask.

     > ⚠️ Please note that `gpt-image-1`'s masking feature does not guarantee 100% control at this time. <br>1) [It's a known & acknowledged model limitation.](https://community.openai.com/t/gpt-image-1-problems-with-mask-edits/1240639/37) <br>2) [OpenAI are looking to address it in a future update.](https://community.openai.com/t/gpt-image-1-problems-with-mask-edits/1240639/41)
<p align="center">
  <img src="./readme-images/mask-creation.jpg" alt="Interface" width="350"/>
</p>

*   **📜 Detailed History & Cost Tracking:**
    *   View a comprehensive history of all your image generations and edits.
    *   See the parameters used for each request.
    *   Get detailed API token usage and estimated cost breakdowns (`$USD`) for each operation. (hint: click the `$` amount on the image)
    *   View the full prompt used for each history item.
    *   View total historical API cost.
    *   Delete items from history

<p align="center">
  <img src="./readme-images/history.jpg" alt="Interface" width="1306"/>
</p>

<p align="center">
  <img src="./readme-images/cost-breakdown.jpg" alt="Interface" width="350"/>
</p>

*   **🖼️ Flexible Image Output View:** View generated image batches as a grid or select individual images for a closer look.
*   **🚀 Send to Edit:** Quickly send any generated or history image directly to the editing form.
*   **📋 Paste to Edit:** Paste images directly from your clipboard into the Edit mode's source image area.
*   **💾 Storage:** Supports two modes via `NEXT_PUBLIC_IMAGE_STORAGE_MODE`:
    *   **Filesystem (default):** Images saved to `./generated-images` on the server.
    *   **IndexedDB:** Images saved directly in the browser's IndexedDB (ideal for serverless deployments).
    *   Generation history metadata is always saved in the browser's local storage.

## ▲ Deploy to Vercel

🚨 *CAUTION: If you deploy from `main` or `master` branch, your Vercel deployment will be **publicly available** to anyone who has the URL. Deploying from other branches will require users to be logged into Vercel (on your team) to access the preview build.* 🚨

You can deploy your own instance of this playground to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/alasano/gpt-image-1-playground&env=OPENAI_API_KEY,NEXT_PUBLIC_IMAGE_STORAGE_MODE,APP_PASSWORD&envDescription=OpenAI%20API%20Key%20is%20required.%20Set%20storage%20mode%20to%20indexeddb%20for%20Vercel%20deployments.&project-name=gpt-image-playground&repository-name=gpt-image-playground)

You will be prompted to enter your API configuration and `APP_PASSWORD` during the deployment setup. For Vercel deployments, it's required to set `NEXT_PUBLIC_IMAGE_STORAGE_MODE` to `indexeddb`.

**For OpenAI deployment:**
- `API_PLATFORM=openai`
- `OPENAI_API_KEY=your_openai_api_key_here`

**For Azure deployment:**
- `API_PLATFORM=azure`
- `AZURE_API_KEY=your_azure_api_key_here`
- `AZURE_BASE_URL=your_azure_endpoint_here`
- `AZURE_DEPLOYMENT_NAME=gpt-image-1`
- `AZURE_API_VERSION=2025-04-01-preview` 

Note: If `NEXT_PUBLIC_IMAGE_STORAGE_MODE` is not set, the application will automatically detect if it's running on Vercel (using the `VERCEL` or `NEXT_PUBLIC_VERCEL_ENV` environment variables) and default to `indexeddb` mode in that case. Otherwise (e.g., running locally), it defaults to `fs` mode. You can always explicitly set the variable to `fs` or `indexeddb` to override this automatic behavior.

## 🚀 Getting Started [Local Deployment]

Follow these steps to get the playground running locally.

### Prerequisites

*   [Node.js](https://nodejs.org/) (Version 20 or later required)
*   [npm](https://www.npmjs.com/), [yarn](https://yarnpkg.com/), [pnpm](https://pnpm.io/), or [bun](https://bun.sh/)

### 1. Set Up API Configuration 🟢

You need to configure either OpenAI or Azure API to use this application.

#### Option A: OpenAI Configuration

⚠️ [Your OpenAI Organization needs to be verified to use `gpt-image-1`](https://help.openai.com/en/articles/10910291-api-organization-verification)

1.  If you don't have a `.env.local` file, create one.
2.  Add your OpenAI API key to the `.env.local` file:

    ```dotenv
    API_PLATFORM=openai
    OPENAI_API_KEY=your_openai_api_key_here
    ```

#### Option B: Azure Configuration

1.  If you don't have a `.env.local` file, create one.
2.  Add your Azure configuration to the `.env.local` file:

    ```dotenv
    API_PLATFORM=azure
    AZURE_API_KEY=your_azure_api_key_here
    AZURE_BASE_URL=https://your-resource-name.cognitiveservices.azure.com
    AZURE_DEPLOYMENT_NAME=gpt-image-1
    AZURE_API_VERSION=2025-04-01-preview
    ```

    **Important:** Keep your API keys secret. The `.env.local` file is included in `.gitignore` by default to prevent accidental commits.

---

#### 🟡 (Optional) IndexedDB Mode (for serverless hosts) [e.g. Vercel]

For environments where the filesystem is read-only or ephemeral (like Vercel serverless functions), you can configure the application to store generated images directly in the browser's IndexedDB using Dexie.js.

Set the following environment variable in your `.env.local` file or directly in your hosting provider's UI (like Vercel):

```dotenv
NEXT_PUBLIC_IMAGE_STORAGE_MODE=indexeddb
```

When this variable is set to `indexeddb`:
*   The server API (`/api/images`) will return the image data as base64 (`b64_json`) instead of saving it to disk.
*   The client-side application will decode the base64 data and store the image blob in IndexedDB.
*   Images will be served directly from the browser's storage using Blob URLs.

If this variable is **not set** or has any other value, the application defaults to the standard behavior of saving images to the `./generated-images` directory on the server's filesystem.

**Note:** If `NEXT_PUBLIC_IMAGE_STORAGE_MODE` is not set, the application will automatically detect if it's running on Vercel (using the `VERCEL` or `NEXT_PUBLIC_VERCEL_ENV` environment variables) and default to `indexeddb` mode in that case. Otherwise (e.g., running locally), it defaults to `fs` mode. You can always explicitly set the variable to `fs` or `indexeddb` to override this automatic behavior.

#### 🟡 (Optional) Use a Custom API Endpoint

If you need to use an OpenAI-compatible API endpoint (e.g., a local model server or a different provider), you can specify its base URL using the `OPENAI_API_BASE_URL` environment variable in your `.env.local` file:

```dotenv
API_PLATFORM=openai
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_BASE_URL=your_compatible_api_endpoint_here
```

If `OPENAI_API_BASE_URL` is not set, the application will default to the standard OpenAI API endpoint.

#### 🟡 Azure Configuration Details

For Azure deployment, you need to configure the following environment variables:

- `API_PLATFORM=azure` - Set to use Azure API
- `AZURE_API_KEY` - Your Azure Cognitive Services API key
- `AZURE_BASE_URL` - Your Azure resource endpoint (e.g., `https://your-resource-name.cognitiveservices.azure.com`)
- `AZURE_DEPLOYMENT_NAME` - Your deployed model name (usually `gpt-image-1`)
- `AZURE_API_VERSION` - API version (defaults to `2025-04-01-preview`)

Example Azure configuration:
```dotenv
API_PLATFORM=azure
AZURE_API_KEY=your_azure_api_key_here
AZURE_BASE_URL=https://tech-m9zbq9hf-westus3.cognitiveservices.azure.com
AZURE_DEPLOYMENT_NAME=gpt-image-1
AZURE_API_VERSION=2025-04-01-preview
```

**Note:** Azure API supports multiple images for editing, just like OpenAI API. The implementation uses the same OpenAI SDK with different base URLs and query parameters.

---


#### 🟡 (Optional) Enable Password Validation
```dotenv
APP_PASSWORD=your_password_here
```
When `APP_PASSWORD` is set, the frontend will prompt you for a password to authenticate requests.
<p align="center">
  <img src="./readme-images/password-dialog.jpg" alt="Password Dialog" width="460"/>
</p>

---

### 2. Install Dependencies 🟢

Navigate to the project directory in your terminal and install the necessary packages:

```bash
npm install
# or
# yarn install
# or
# pnpm install
# or
# bun install
```

### 3. Run the Development Server 🟢

Start the Next.js development server:

```bash
npm run dev
# or
# yarn dev
# or
# pnpm dev
# or
# bun dev
```

### 4. Open the Playground 🟢

Open [http://localhost:3000](http://localhost:3000) in your web browser. You should now be able to use the gpt-image-1 Playground!

## 🤝 Contributing

Contributions are welcome! Issues and feature requests, not as much welcome but I'll think about it.

## 📄 License

MIT

## 总结

我已经成功为 **GPT-Image-1 Playground** 项目添加了 **Azure 平台支持**，实现了以下功能：

###  主要改进

1. **新增 API 客户端架构** (`src/lib/api-client.ts`)
   - 支持 OpenAI 和 Azure 两种平台
   - 使用 fetch API 替代 OpenAI SDK 进行 Azure 调用
   - 保持与现有代码的兼容性

2. **环境变量配置**
   - `API_PLATFORM`: 选择平台 (`openai` 或 `azure`)
   - Azure 专用配置：
     - `AZURE_API_KEY`: Azure API 密钥
     - `AZURE_BASE_URL`: Azure 资源端点
     - `AZURE_DEPLOYMENT_NAME`: 部署名称
     - `AZURE_API_VERSION`: API 版本

3. **API 路由更新** (`src/app/api/images/route.ts`)
   - 使用新的 API 客户端架构
   - 支持两种平台的图像生成和编辑
   - 保持原有的错误处理和响应格式

4. **文档更新** (`README.md`)
   - 添加了 Azure 配置说明
   - 更新了部署指南
   - 提供了详细的配置示例

###  技术实现

- **无耦合设计**: 新功能完全独立，不影响现有 OpenAI 功能
- **类型安全**: 使用 TypeScript 确保类型安全
- **错误处理**: 完善的错误处理和日志记录
- **向后兼容**: 现有 OpenAI 配置继续正常工作

###  使用方法

**OpenAI 配置:**
```dotenv
API_PLATFORM=openai
OPENAI_API_KEY=your_openai_api_key_here
```

**Azure 配置:**
```dotenv
API_PLATFORM=azure
AZURE_API_KEY=your_azure_api_key_here
AZURE_BASE_URL=https://your-resource-name.cognitiveservices.azure.com
AZURE_DEPLOYMENT_NAME=your_deployment_name
AZURE_API_VERSION=2025-04-01-preview
```

### ✅ 验证

- 项目构建成功 ✅
- 类型检查通过 ✅
- 保持原有功能完整性 ✅
- 文档更新完整 ✅

现在项目支持您提供的 Azure curl 调用方式，用户可以通过简单的环境变量配置在 OpenAI 和 Azure 之间切换，而无需修改任何代码或添加新的依赖包。
