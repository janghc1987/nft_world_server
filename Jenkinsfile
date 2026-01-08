pipeline {
  agent any
  stages {
    stage('build') {
      steps {
        echo 'build'
        // zip zipFile: "Dockerrun.aws.json.zip", dir: "./", glob: "Dockerrun.aws.json"
        sh "zip -r msc-backend-node-${BUILD_TAG}.zip Dockerrun.aws.json"
        sh 'docker build -t 150128311360.dkr.ecr.ap-northeast-1.amazonaws.com/msc-backend-node .'
      }
    }

    stage('upload') {
      steps {
        script {
          withAWS(region:'ap-northeast-1', credentials:'aws-deploy') {
            echo 'upload'
            def login = ecrLogin()
            sh "${login}"
            // sh "sudo \$(aws ecr get-login --region ap-northeast-1 --no-include-email)"
            // def login = sh 'aws ecr get-login --region ap-northeast-1 --no-include-email'
            // echo '\${login}'
            // sh 'sudo \${login}'
            // sh '\${ecrLogin()}'
            // sh "docker push ${ecrName}/${repoName}/${applicationName}-nginx:latest"
            sh 'docker push 150128311360.dkr.ecr.ap-northeast-1.amazonaws.com/msc-backend-node'
            
            sh "aws s3 cp msc-backend-node-${BUILD_TAG}.zip s3://msc-deploy-repository/msc-backend-node/msc-backend-node-${BUILD_TAG}.zip \
              --acl public-read-write \
              --region ap-northeast-1"
          }
        }
      }
    }

    stage('deploy') {
      steps {
        withAWS(region:'ap-northeast-1', credentials:'aws-deploy') {

          echo 'deploy'
          
          sh "aws elasticbeanstalk create-application-version \
            --region ap-northeast-1 \
            --application-name msc-service \
            --version-label ${BUILD_TAG} \
            --description ${BUILD_TAG} \
            --source-bundle S3Bucket='msc-deploy-repository',S3Key='msc-backend-node/msc-backend-node-${BUILD_TAG}.zip'"

          sh "aws elasticbeanstalk update-environment \
            --region ap-northeast-1 \
            --environment-name MSC-backend-Node-Docker \
            --version-label ${BUILD_TAG}"
        }
      }
    }
  }
}