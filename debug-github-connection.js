const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function debugGitHubConnection() {
  console.log('🔍 Debug GitHub Connection...\n');
  
  // 1. Kiểm tra environment variables
  console.log('📋 Bước 1: Kiểm tra Environment Variables');
  console.log('=' .repeat(50));
  
  const githubRepo = process.env.GITHUB_REPO;
  const githubToken = process.env.GITHUB_TOKEN;
  
  console.log(`GITHUB_REPO: ${githubRepo || '❌ Không có'}`);
  console.log(`GITHUB_TOKEN: ${githubToken ? `${githubToken.substring(0, 10)}...` : '❌ Không có'}`);
  
  if (!githubRepo || !githubToken) {
    console.log('\n❌ Thiếu environment variables!');
    console.log('Hãy kiểm tra Render environment variables');
    console.log('Cần có: GITHUB_REPO và GITHUB_TOKEN');
    return;
  }
  
  // 2. Kiểm tra format repository
  console.log('\n📋 Bước 2: Kiểm tra Format Repository');
  console.log('=' .repeat(50));
  
  if (!githubRepo.includes('/')) {
    console.log('❌ GITHUB_REPO format sai!');
    console.log('Đúng: username/repository-name');
    console.log('Sai: https://github.com/username/repository-name');
    return;
  }
  
  console.log(`✅ Repository format: ${githubRepo}`);
  
  // 3. Kiểm tra token format
  console.log('\n📋 Bước 3: Kiểm tra Token Format');
  console.log('=' .repeat(50));
  
  if (!githubToken.startsWith('ghp_')) {
    console.log('❌ GITHUB_TOKEN format sai!');
    console.log('Token phải bắt đầu bằng ghp_');
    return;
  }
  
  console.log('✅ Token format đúng');
  
  // 4. Test GitHub API connection
  console.log('\n📋 Bước 4: Test GitHub API Connection');
  console.log('=' .repeat(50));
  
  try {
    const testCmd = `curl -H "Authorization: token ${githubToken}" https://api.github.com/repos/${githubRepo}`;
    console.log('Đang test kết nối GitHub API...');
    
    const { stdout } = await execAsync(testCmd);
    const repoInfo = JSON.parse(stdout);
    
    if (repoInfo.message === 'Not Found') {
      console.log('❌ Repository không tồn tại hoặc không có quyền truy cập');
      console.log('Kiểm tra:');
      console.log('1. Repository có tồn tại không?');
      console.log('2. Token có quyền truy cập repository không?');
      console.log('3. Repository có private không?');
      return;
    }
    
    if (repoInfo.message && repoInfo.message.includes('Bad credentials')) {
      console.log('❌ Token không hợp lệ');
      console.log('Hãy tạo token mới với quyền repo');
      return;
    }
    
    console.log('✅ Kết nối GitHub API thành công!');
    console.log(`Repository: ${repoInfo.full_name}`);
    console.log(`Visibility: ${repoInfo.private ? 'Private' : 'Public'}`);
    console.log(`Description: ${repoInfo.description || 'Không có'}`);
    
  } catch (error) {
    console.log('❌ Lỗi kết nối GitHub API:');
    console.log(error.message);
    
    if (error.message.includes('curl')) {
      console.log('\n💡 Gợi ý:');
      console.log('1. Kiểm tra kết nối internet');
      console.log('2. Thử test trên terminal:');
      console.log(`   curl -H "Authorization: token ${githubToken.substring(0, 10)}..." https://api.github.com/repos/${githubRepo}`);
    }
    return;
  }
  
  // 5. Test repository access
  console.log('\n📋 Bước 5: Test Repository Access');
  console.log('=' .repeat(50));
  
  try {
    const contentsCmd = `curl -H "Authorization: token ${githubToken}" https://api.github.com/repos/${githubRepo}/contents`;
    console.log('Đang kiểm tra quyền truy cập repository...');
    
    const { stdout } = await execAsync(contentsCmd);
    const contents = JSON.parse(stdout);
    
    if (Array.isArray(contents)) {
      console.log('✅ Có quyền truy cập repository');
      console.log(`Số file/folder: ${contents.length}`);
    } else if (contents.message === 'This repository is empty.') {
      console.log('✅ Có quyền truy cập repository (repository trống)');
      console.log('Repository trống - đây là bình thường cho repository mới');
    } else {
      console.log('❌ Không có quyền truy cập repository');
      console.log('Response:', JSON.stringify(contents, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Lỗi kiểm tra quyền truy cập:');
    console.log(error.message);
  }
  
  // 6. Test branch creation
  console.log('\n📋 Bước 6: Test Branch Creation (Simulation)');
  console.log('=' .repeat(50));
  
  try {
    const branchesCmd = `curl -H "Authorization: token ${githubToken}" https://api.github.com/repos/${githubRepo}/branches`;
    const { stdout } = await execAsync(branchesCmd);
    const branches = JSON.parse(stdout);
    
    console.log('✅ Có thể lấy danh sách branches');
    console.log(`Số branches: ${branches.length}`);
    
    const branchNames = branches.map(b => b.name);
    console.log(`Branches: ${branchNames.join(', ')}`);
    
    if (branchNames.includes('data-backup')) {
      console.log('✅ Branch data-backup đã tồn tại');
    } else {
      console.log('ℹ️ Branch data-backup sẽ được tạo tự động');
    }
    
  } catch (error) {
    console.log('❌ Lỗi kiểm tra branches:');
    console.log(error.message);
  }
  
  console.log('\n🎯 Kết luận:');
  console.log('=' .repeat(50));
  console.log('Nếu tất cả các bước trên đều ✅, thì GitHub connection đã sẵn sàng!');
  console.log('Hãy restart bot và thử lại lệnh /persistent status');
}

// Chạy debug
debugGitHubConnection().catch(console.error); 