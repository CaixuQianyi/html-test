const fs = require('fs');
const path = require('path');

const photosDir = path.join(__dirname, '..', 'photos');


fs.readdir(photosDir, (err, files) => {
  if (err) {
    console.error('读取 photos 目录失败:', err);
    return;
  }

  // 过滤出png文件
  const pngFiles = files.filter(f => f.toLowerCase().endsWith('.png'));

  // 按照文件名降序排序（符合您按日期降序的需求）
  pngFiles.sort((a, b) => b.localeCompare(a));

  // 输出数组代码
  console.log('const photoFiles = [');
  pngFiles.forEach(f => {
    console.log(`  "${f}",`);
  });
  console.log('];');
});
