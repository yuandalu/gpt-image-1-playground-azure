import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

const outputDir = path.resolve(process.cwd(), 'generated-images');
// Increase timeout to 5 minutes (300000ms)
const API_TIMEOUT = 300000;
// Maximum number of retries for API calls
const MAX_RETRIES = 3;
// Delay between retries in milliseconds
const RETRY_DELAY = 2000;

async function ensureOutputDirExists() {
  try {
    await fs.access(outputDir);
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      try {
        await fs.mkdir(outputDir, { recursive: true });
        console.log(`Created output directory: ${outputDir}`);
      } catch (mkdirError) {
        console.error(`Error creating output directory ${outputDir}:`, mkdirError);
        throw new Error('Failed to create image output directory.');
      }
    } else {
      console.error(`Error accessing output directory ${outputDir}:`, error);
      throw new Error(`Failed to access or ensure image output directory exists. Original error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Helper function to implement retry logic
async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (retries > 0 && (error instanceof Error && 
        (error.message.includes('timeout') || 
         error.message.includes('network') || 
         error.message.includes('connect')))) {
      console.log(`API call failed, retrying (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})...`);
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log('Received POST request to /api/images');

  if (!process.env.API_KEY || !process.env.API_BASE_URL || !process.env.API_VERSION) {
    console.error('API_KEY, API_BASE_URL, or API_VERSION is not set.');
    return NextResponse.json(
      { error: 'Server configuration error: API key not found.' },
      { status: 500 }
    );
  }

  try {
    await ensureOutputDirExists();

    const formData = await request.formData();
    const mode = formData.get('mode') as 'generate' | 'edit' | null;
    const prompt = formData.get('prompt') as string | null;

    console.log(`Mode: ${mode}, Prompt: ${prompt ? prompt.substring(0, 50) + '...' : 'N/A'}`);

    if (!mode || !prompt) {
      return NextResponse.json(
        { error: 'Missing required parameters: mode and prompt' },
        { status: 400 }
      );
    }

    let result: OpenAI.Images.ImagesResponse;
    const model = 'gpt-image-1';

    if (mode === 'generate') {
      const n = parseInt(formData.get('n') as string || '1', 10);
      const size = formData.get('size') as OpenAI.Images.ImageGenerateParams['size'] || '1024x1024';
      const quality = formData.get('quality') as OpenAI.Images.ImageGenerateParams['quality'] || 'auto';
      const output_format = formData.get('output_format') as OpenAI.Images.ImageGenerateParams['output_format'] || 'png';
      const output_compression_str = formData.get('output_compression') as string | null;
      const background = formData.get('background') as OpenAI.Images.ImageGenerateParams['background'] || 'auto';
      const moderation = formData.get('moderation') as OpenAI.Images.ImageGenerateParams['moderation'] || 'auto';

      const params: OpenAI.Images.ImageGenerateParams = {
        model,
        prompt,
        n: Math.max(1, Math.min(n || 1, 10)), 
        size,
        quality,
        output_format,
        background,
        moderation,
      };

      if ((output_format === 'jpeg' || output_format === 'webp') && output_compression_str) {
         const compression = parseInt(output_compression_str, 10);
         if (!isNaN(compression) && compression >= 0 && compression <= 100) {
            params.output_compression = compression;
         }
      }

      console.log('Calling OpenAI generate with params:', params);
      
      try {
        const response = await fetchWithRetry(
          `${process.env.API_BASE_URL}/images/generations?api-version=${process.env.API_VERSION}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': process.env.API_KEY || ''
            },
            body: JSON.stringify({
              prompt: params.prompt,
              size: params.size,
              quality: params.quality,
              n: params.n,
              output_format: params.output_format,
              background: params.background,
              moderation: params.moderation,
            }),
            signal: AbortSignal.timeout(API_TIMEOUT)
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`API request failed: ${response.status} ${response.statusText}${errorData.error ? ` - ${errorData.error}` : ''}`);
        }
        result = await response.json();
      } catch (fetchError) {
        console.error('Error during API fetch:', fetchError);
        if (fetchError instanceof Error) {
          if (fetchError.message.includes('timeout') || fetchError.message.includes('AbortSignal')) {
            throw new Error(`Request timed out after ${API_TIMEOUT/1000} seconds. Please try again.`);
          }
        }
        throw fetchError;
      }

    } else if (mode === 'edit') {
      const n = parseInt(formData.get('n') as string || '1', 10);
      const size = formData.get('size') as OpenAI.Images.ImageEditParams['size'] || 'auto';
      const quality = formData.get('quality') as OpenAI.Images.ImageEditParams['quality'] || 'auto';

      
      const imageFiles: File[] = [];
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('image_') && value instanceof File) {
          imageFiles.push(value);
        }
      }

      if (imageFiles.length === 0) {
        return NextResponse.json({ error: 'No image file provided for editing.' }, { status: 400 });
      }

      const maskFile = formData.get('mask') as File | null;

      const params: OpenAI.Images.ImageEditParams = {
        model,
        prompt,
        image: imageFiles,
        n: Math.max(1, Math.min(n || 1, 10)),
        size: size === 'auto' ? undefined : size, 
        quality: quality === 'auto' ? undefined : quality, 
      };

      if (maskFile) {
        params.mask = maskFile;
      }

      console.log('Calling OpenAI edit with params:', {
          ...params,
          image: `[${imageFiles.map(f => f.name).join(', ')}]`, 
          mask: maskFile ? maskFile.name : 'N/A'
      });

      const editFormData = new FormData();
      editFormData.append('prompt', params.prompt);
      editFormData.append('n', (params.n ?? 1).toString());
      if (params.size) editFormData.append('size', params.size);
      if (params.quality) editFormData.append('quality', params.quality);
      
      // Append each image file
      imageFiles.forEach(file => {
        editFormData.append('image', file);
      });
      
      // Append mask if exists
      if (maskFile) {
        editFormData.append('mask', maskFile);
      }

      try {
        const response = await fetchWithRetry(
          `${process.env.API_BASE_URL}/images/edits?api-version=${process.env.API_VERSION}`,
          {
            method: "POST",
            headers: {
              "api-key": process.env.API_KEY || ''
            },
            body: editFormData,
            signal: AbortSignal.timeout(API_TIMEOUT)
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`API request failed: ${response.status} ${response.statusText}${errorData.error ? ` - ${errorData.error}` : ''}`);
        }
        result = await response.json();
      } catch (fetchError) {
        console.error('Error during API fetch:', fetchError);
        if (fetchError instanceof Error) {
          if (fetchError.message.includes('timeout') || fetchError.message.includes('AbortSignal')) {
            throw new Error(`Request timed out after ${API_TIMEOUT/1000} seconds. Please try again.`);
          }
        }
        throw fetchError;
      }

    } else {
      return NextResponse.json({ error: 'Invalid mode specified' }, { status: 400 });
    }

    console.log('OpenAI API call successful.');

    
    if (!result || !Array.isArray(result.data) || result.data.length === 0) {
      console.error('Invalid or empty data received from OpenAI API:', result);
      return NextResponse.json(
        { error: 'Failed to retrieve image data from API.' },
        { status: 500 }
      );
    }

    const savedImagesData = await Promise.all(
      result.data.map(async (imageData, index) => {
        if (!imageData.b64_json) {
          console.error(`Image data ${index} is missing b64_json.`);
          throw new Error(`Image data at index ${index} is missing base64 data.`);
        }
        const buffer = Buffer.from(imageData.b64_json, 'base64');
        const timestamp = Date.now();
        
        const fileExtension = formData.get('output_format') as string || 'png';
        const filename = `${timestamp}-${index}.${fileExtension}`;
        const filepath = path.join(outputDir, filename);

        console.log(`Attempting to save image to: ${filepath}`);
        await fs.writeFile(filepath, buffer);
        console.log(`Successfully saved image: ${filename}`);

        return {
          b64_json: imageData.b64_json,
          path: `/generated-images/${filename}`, 
          filename: filename,
        };
      })
    );

    console.log('All images processed and saved.');
    
    return NextResponse.json({ images: savedImagesData, usage: result.usage });

  } catch (error: unknown) {
    console.error('Error in /api/images:', error);

    let errorMessage = 'An unexpected error occurred.';
    let status = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific error types
      if (error.message.includes('timeout') || error.message.includes('AbortSignal')) {
        errorMessage = `Request timed out. The server took too long to respond. Please try again.`;
        status = 504; // Gateway Timeout
      } else if (error.message.includes('network') || error.message.includes('connect')) {
        errorMessage = `Network error: Unable to connect to the image generation service. Please check your internet connection and try again.`;
        status = 503; // Service Unavailable
      }
      
      if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
        status = error.status;
      }
    } else if (typeof error === 'object' && error !== null) {
        if ('message' in error && typeof error.message === 'string') {
            errorMessage = error.message;
        }
        if ('status' in error && typeof error.status === 'number') {
            status = error.status;
        }
    }

    return NextResponse.json({ error: errorMessage }, { status });
  }
}