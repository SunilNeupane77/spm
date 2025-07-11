# Cloudinary Upload Troubleshooting

If you're experiencing issues with resource uploads to Cloudinary, follow these steps to diagnose and fix the problem:

## Quick Fix Steps

1. **Check Network Connection**
   Make sure your development server has internet access.

2. **Verify Environment Variables**
   Ensure these variables are correctly set in your `.env.local` file:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   ```

3. **Run the Diagnostic Script**
   ```
   node scripts/check-cloudinary-config.js
   ```

4. **Check File Size**
   The upload limit is 20MB. Try with a smaller file.

5. **Restart the Development Server**
   Sometimes a simple restart can fix issues:
   ```
   npm run dev
   ```

## Advanced Troubleshooting

### 1. Check Cloudinary Console
Log in to your Cloudinary console and verify:
- Your account is active
- You have sufficient upload credits
- There are no restrictions on your account

### 2. Inspect Network Requests
Open browser developer tools to check:
- The request is being sent correctly
- The response contains detailed error information

### 3. Test with cURL
You can test a direct upload to Cloudinary with cURL:

```bash
curl -X POST -F "file=@path/to/small/test/image.jpg" \
  -F "upload_preset=YOUR_UPLOAD_PRESET" \
  https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload
```

### 4. Common Error Causes

- **File processing errors**: The file may be corrupted or unsupported
- **Authentication errors**: API key or secret may be incorrect
- **Rate limiting**: Too many uploads in a short period
- **Account issues**: Unpaid bills or account restrictions

## If All Else Fails

Try creating a new Cloudinary account to rule out account-specific issues.
