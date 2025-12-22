const { withAndroidManifest, withMainApplication } = require('@expo/config-plugins');

/**
 * Expo config plugin to register the StepWaterService native module
 */
const withStepWaterService = (config) => {
  // Add service and receiver to AndroidManifest
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    if (!manifest.application) {
      manifest.application = [{}];
    }

    const application = manifest.application[0];

    // Add service
    if (!application.service) {
      application.service = [];
    }

    const serviceExists = application.service.some(
      (s) => s.$?.['android:name'] === 'com.stepwater.service.StepWaterForegroundService'
    );

    if (!serviceExists) {
      application.service.push({
        $: {
          'android:name': 'com.stepwater.service.StepWaterForegroundService',
          'android:enabled': 'true',
          'android:exported': 'false',
          'android:foregroundServiceType': 'dataSync',
        },
      });
    }

    // Add receiver
    if (!application.receiver) {
      application.receiver = [];
    }

    const receiverExists = application.receiver.some(
      (r) => r.$?.['android:name'] === 'com.stepwater.service.BootReceiver'
    );

    if (!receiverExists) {
      application.receiver.push({
        $: {
          'android:name': 'com.stepwater.service.BootReceiver',
          'android:enabled': 'true',
          'android:exported': 'true',
          'android:permission': 'android.permission.RECEIVE_BOOT_COMPLETED',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.intent.action.BOOT_COMPLETED',
                },
              },
              {
                $: {
                  'android:name': 'android.intent.action.QUICKBOOT_POWERON',
                },
              },
            ],
            category: [
              {
                $: {
                  'android:name': 'android.intent.category.DEFAULT',
                },
              },
            ],
          },
        ],
      });
    }

    return config;
  });

  // Register the package in MainApplication
  config = withMainApplication(config, (config) => {
    const mainApplication = config.modResults.contents;

    // Check if package is already imported
    if (!mainApplication.includes('import com.stepwater.service.StepWaterServicePackage;')) {
      // Add import after other imports
      const importRegex = /(import com\.facebook\.react\.ReactPackage;)/;
      if (importRegex.test(mainApplication)) {
        mainApplication = mainApplication.replace(
          importRegex,
          `$1\nimport com.stepwater.service.StepWaterServicePackage;`
        );
      } else {
        // Add at the top if ReactPackage import not found
        const packageImport = 'import com.stepwater.service.StepWaterServicePackage;';
        const classDeclaration = mainApplication.indexOf('public class');
        if (classDeclaration > 0) {
          mainApplication = mainApplication.slice(0, classDeclaration) +
            packageImport + '\n' +
            mainApplication.slice(classDeclaration);
        }
      }
    }

    // Check if package is already added to getPackages()
    if (!mainApplication.includes('new StepWaterServicePackage()')) {
      const packagesRegex = /(return Arrays\.<ReactPackage>asList\([\s\S]*?)(\);)/;
      if (packagesRegex.test(mainApplication)) {
        mainApplication = mainApplication.replace(
          packagesRegex,
          (match, before, after) => {
            // Add the package before the closing parenthesis
            return before + '\n        new StepWaterServicePackage(),' + after;
          }
        );
      } else {
        // If getPackages() doesn't exist, we need to add it
        // This is a fallback - normally it should exist
        console.warn('Could not find getPackages() method to add StepWaterServicePackage');
      }
    }

    config.modResults.contents = mainApplication;
    return config;
  });

  return config;
};

module.exports = withStepWaterService;






